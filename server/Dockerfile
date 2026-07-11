# --- Estágio de Compilação ---
FROM golang:1.26-alpine AS builder

WORKDIR /app

# Copia os arquivos de definição do módulo e baixa as dependências
COPY go.mod go.sum ./
RUN go mod download

# Copia os fontes e compila o binário estático
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o server .

# --- Estágio de Execução ---
FROM alpine:latest
RUN apk --no-cache add ca-certificates

WORKDIR /root/

# Copia o binário compilado do estágio anterior
COPY --from=builder /app/server .

# Expõe a porta padrão (o Cloud Run define a porta via variável PORT)
EXPOSE 8080

# Comando para rodar a aplicação
CMD ["./server"]
