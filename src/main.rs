use std::fs;
use std::sync::{Mutex, Arc};
use serde::{Deserialize, Serialize};
use chrono::Utc;
use sha2::{Sha256, Digest};
use actix_web::{web, App, HttpResponse, HttpServer, Responder};
use actix_cors::Cors;
use actix_web::middleware::Logger;
use std::env;
use dotenv::dotenv;
use env_logger;

#[derive(Serialize, Deserialize, Debug, Clone)]
struct Transaction {
    sender: String,
    recipient: String,
    amount: f64,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
struct Block {
    timestamp: i64,
    transactions: Vec<Transaction>,
    previous_hash: String,
    nonce: u64,
    hash: String,
}

impl Block {
    fn new_block(transactions: Vec<Transaction>, previous_hash: String) -> Self {
        let timestamp = Utc::now().timestamp();
        let mut block = Block {
            timestamp, 
            transactions,
            previous_hash,
            nonce: 0,
            hash: "".to_string(),
        };
        block.hash = block.calculate_hash();
        block
    }

    fn calculate_hash(&self) -> String {
        let mut hasher = Sha256::new();
        hasher.update(format!("{:?}{:?}{:?}{:?}", self.timestamp, self.transactions, self.previous_hash, self.nonce));
        format!("{:x}", hasher.finalize())
    }

    fn mine_block(&mut self, difficulty: usize) {
        while &self.hash[0..difficulty] != "0".repeat(difficulty).as_str() {
            self.nonce += 1;
            self.hash = self.calculate_hash();
        }
    }
}

#[derive(Serialize, Deserialize, Debug, Clone)]
struct Blockchain {
    blocks: Vec<Block>,
    difficulty: usize
}

impl Blockchain {
    fn new() -> Self {
        let genesis_block = Block::new_block(vec![], "0".to_string());
        Blockchain { blocks: vec![genesis_block], difficulty: 2 }
    }

    fn add_block(&mut self, transactions: Vec<Transaction>) {
        let previous_hash = self.blocks.last().unwrap().hash.clone();
        let mut new_block = Block::new_block(transactions, previous_hash);
        new_block.mine_block(self.difficulty);
        self.blocks.push(new_block);
    }

    fn validate(&self) -> bool {
        for (i, block) in self.blocks.iter().enumerate() {
            if i == 0 {
                continue;
            }
            
            let previous_block = &self.blocks[i - 1];
            if block.hash != block.calculate_hash() {
                return false;
            }

            if block.previous_hash != previous_block.hash {
                return false;
            }
        }
        true
    }

    fn save_to_file(&self, filename: &str) -> std::io::Result<()> {
        let data = serde_json::to_string_pretty(self)?;
        fs::write(filename, data)?;
        Ok(())
    }

    fn load_from_file(filename: &str) -> std::io::Result<Self> {
        let data = fs::read_to_string(filename)?;
        let blockchain: Blockchain = serde_json::from_str(&data)?;
        Ok(blockchain)
    }
}

struct AppState {
    blockchain: Mutex<Blockchain>
}

async fn get_chain(data: web::Data<Arc<AppState>>) -> impl Responder {
    let blockchain = data.blockchain.lock().unwrap().clone();
    HttpResponse::Ok().json(blockchain)
}

async fn add_block(data: web::Data<Arc<AppState>>, transactions: web::Json<Vec<Transaction>>) -> impl Responder {
    let mut blockchain = data.blockchain.lock().unwrap();
    blockchain.add_block(transactions.into_inner());
    HttpResponse::Ok().json(serde_json::json!({
        "message": "Block added successfully"
    }))
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    // Load .env file if it exists
    dotenv().ok();

    // Enable logging
    env_logger::init_from_env(env_logger::Env::new().default_filter_or("info"));

    let port = env::var("PORT").unwrap_or_else(|_| "8080".to_string());
    let host = env::var("HOST").unwrap_or_else(|_| "0.0.0.0".to_string());
    let address = format!("{}:{}", host, port);

    let filename = "blockchain.json";
    let blockchain = if let Ok(blockchain) = Blockchain::load_from_file(filename) {
        blockchain
    } else {
        Blockchain::new()
    };

    let app_state = Arc::new(AppState {
        blockchain: Mutex::new(blockchain),
    });

    let app_state_clone = Arc::clone(&app_state);

    println!("Starting blockchain server on {}", address);

    HttpServer::new(move || {
        let cors = Cors::permissive();
        
        App::new()
            .wrap(cors)
            .wrap(Logger::default())
            .app_data(web::Data::new(app_state.clone()))
            .route("/chain", web::get().to(get_chain))
            .route("/add_block", web::post().to(add_block))
    })
    .bind(&address)?
    .run()
    .await?;

    let blockchain = app_state_clone.blockchain.lock().unwrap();
    if blockchain.validate() {
        println!("Blockchain is valid");
    } else {
        println!("Blockchain is invalid");
    }
    blockchain.save_to_file(filename).unwrap();
    Ok(())
}
