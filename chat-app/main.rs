use actix_web::{get, App, HttpResponse, HttpServer, Responder};
use std::env;

#[get("/")]
async fn hello() -> impl Responder {
    HttpResponse::Ok().body("¡Servidor en Rust corriendo en Render!")
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    // Render asigna dinámicamente un puerto en la variable de entorno PORT (por defecto 8080 localmente)
    let port = env::var("PORT").unwrap_or_else(|_| "8080".to_string());
    let address = format!("0.0.0.0:{}", port);

    println!("Servidor iniciado en http://{}", address);

    HttpServer::new(|| App::new().service(hello))
        .bind(&address)?
        .run()
        .await
}