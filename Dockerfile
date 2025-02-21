FROM rust:1.75-slim as builder

WORKDIR /usr/src/app
COPY . .

RUN cargo build --release

FROM debian:bookworm-slim

COPY --from=builder /usr/src/app/target/release/blockchain /usr/local/bin/blockchain

ENV PORT=8080
EXPOSE 8080

CMD ["blockchain"] 