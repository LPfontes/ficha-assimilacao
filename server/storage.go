package main

import (
	"context"
	"crypto/md5"
	"encoding/base64"
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	"cloud.google.com/go/storage"
)

var (
	gcsClient  *storage.Client
	bucketName string
)

// initStorage initializes the Google Cloud Storage client.
func initStorage() {
	bucketName = os.Getenv("GCS_BUCKET_NAME")
	if bucketName == "" {
		log.Println("[STORAGE] GCS_BUCKET_NAME não configurada. Mapas serão salvos como base64 no banco de dados.")
		return
	}

	var err error
	ctx := context.Background()
	// NewClient automatically picks up Application Default Credentials (ADC)
	gcsClient, err = storage.NewClient(ctx)
	if err != nil {
		log.Printf("[STORAGE] Falha ao inicializar o cliente GCS usando credenciais padrão: %v. Mapas serão armazenados em base64.", err)
		gcsClient = nil
		bucketName = ""
	} else {
		log.Printf("[STORAGE] Google Cloud Storage inicializado com sucesso. Bucket: %s", bucketName)
	}
}

// UploadBase64Image decodes a base64 image data URL and uploads it to GCS.
// Returns the public GCS URL, or an error.
func UploadBase64Image(dataURL string) (string, error) {
	if gcsClient == nil || bucketName == "" {
		return "", fmt.Errorf("GCS client not configured")
	}

	// Data URLs are formatted like "data:image/png;base64,iVBORw0KGgo..."
	parts := strings.SplitN(dataURL, ",", 2)
	if len(parts) != 2 {
		return "", fmt.Errorf("formato de Data URL inválido")
	}

	header := parts[0]
	body := parts[1]

	if !strings.HasPrefix(header, "data:image/") || !strings.Contains(header, ";base64") {
		return "", fmt.Errorf("apenas imagens base64 são suportadas para upload no Cloud Storage")
	}

	// Extract Content-Type and determine file extension
	contentType := strings.TrimSuffix(strings.TrimPrefix(header, "data:"), ";base64")
	ext := "png"
	if strings.Contains(contentType, "jpeg") || strings.Contains(contentType, "jpg") {
		ext = "jpg"
	} else if strings.Contains(contentType, "webp") {
		ext = "webp"
	} else if strings.Contains(contentType, "gif") {
		ext = "gif"
	}

	// Decode the base64 string
	data, err := base64.StdEncoding.DecodeString(body)
	if err != nil {
		return "", fmt.Errorf("falha ao decodificar base64: %v", err)
	}

	// Hash the content to create a unique filename (prevents duplicates)
	hash := md5.Sum(data)
	filename := fmt.Sprintf("maps/%x.%s", hash, ext)

	ctx, cancel := context.WithTimeout(context.Background(), 20*time.Second)
	defer cancel()

	// Perform GCS upload
	bucket := gcsClient.Bucket(bucketName)
	obj := bucket.Object(filename)

	w := obj.NewWriter(ctx)
	w.ContentType = contentType
	w.CacheControl = "public, max-age=31536000" // Cache maps for 1 year since filenames are content-hashed

	if _, err := w.Write(data); err != nil {
		_ = w.Close()
		return "", fmt.Errorf("falha ao escrever imagem no GCS: %v", err)
	}

	if err := w.Close(); err != nil {
		return "", fmt.Errorf("falha ao fechar GCS writer: %v", err)
	}

	// Attempt to set object read permissions to public.
	// Ignore errors if Uniform Bucket-Level Access is enabled on the bucket.
	_ = obj.ACL().Set(ctx, storage.AllUsers, storage.RoleReader)

	publicURL := fmt.Sprintf("https://storage.googleapis.com/%s/%s", bucketName, filename)
	log.Printf("[STORAGE] Imagem de mapa salva no GCS: %s", publicURL)
	return publicURL, nil
}

// DeleteImageFromGCS deletes an image from GCS if it belongs to our configured bucket.
func DeleteImageFromGCS(url string) error {
	if gcsClient == nil || bucketName == "" {
		return nil // Cloud Storage not active, nothing to delete
	}

	prefix := fmt.Sprintf("https://storage.googleapis.com/%s/", bucketName)
	if !strings.HasPrefix(url, prefix) {
		return nil // Not hosted in our bucket, skip deletion
	}

	objectName := strings.TrimPrefix(url, prefix)
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	err := gcsClient.Bucket(bucketName).Object(objectName).Delete(ctx)
	if err != nil {
		// Object might have already been deleted, log warning
		log.Printf("[STORAGE] Falha ao excluir objeto '%s' do GCS: %v", objectName, err)
		return err
	}

	log.Printf("[STORAGE] Objeto removido com sucesso do GCS: %s", objectName)
	return nil
}
