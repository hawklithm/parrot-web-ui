use sqlx::{PgPool, Row};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenvy::dotenv().ok();
    let pool = PgPool::connect(&std::env::var("DATABASE_URL")?).await?;

    println!("🔍 查询 Run 和 Task 的关联关系");
    println!("{}", "=".repeat(80));
    println!();

    println!("1️⃣ 查询 Run bdbbb599:");
    println!("{}", "-".repeat(80));
    let rows = sqlx::query("SELECT substring(id::text, 1, 8) as run_id, substring(issue_id::text, 1, 8) as issue_id, status::text FROM agent_runs WHERE id::text LIKE 'bdbbb599%'")
        .fetch_all(&pool).await?;
    
    if rows.is_empty() {
        println!("  ❌ 未找到 run bdbbb599");
    } else {
        for row in rows {
            let run_id: String = row.try_get(0)?;
            let issue_id: Option<String> = row.try_get(1).ok();
            let status: String = row.try_get(2)?;
            println!("  Run ID: {}", run_id);
            println!("  关联的 Issue: {:?}", issue_id);
            println!("  状态: {}", status);
            
            if let Some(id) = issue_id {
                if id.starts_with("ec3365f4") {
                    println!("  ✅ 关联到 task ec3365f4");
                }
            }
        }
    }

    println!();
    println!("2️⃣ 查询 Run efcfeaf2:");
    println!("{}", "-".repeat(80));
    let rows = sqlx::query("SELECT substring(id::text, 1, 8) as run_id, substring(issue_id::text, 1, 8) as issue_id, status::text FROM agent_runs WHERE id::text LIKE 'efcfeaf2%'")
        .fetch_all(&pool).await?;
    
    if rows.is_empty() {
        println!("  ❌ 未找到 run efcfeaf2");
    } else {
        for row in rows {
            let run_id: String = row.try_get(0)?;
            let issue_id: Option<String> = row.try_get(1).ok();
            let status: String = row.try_get(2)?;
            println!("  Run ID: {}", run_id);
            println!("  关联的 Issue: {:?}", issue_id);
            println!("  状态: {}", status);
            
            if let Some(id) = issue_id {
                if id.starts_with("ec3365f4") {
                    println!("  ✅ 关联到 task ec3365f4");
                }
            }
        }
    }

    println!();
    println!("3️⃣ 查询关联到 task ec3365f4 的所有 Runs:");
    println!("{}", "-".repeat(80));
    let rows = sqlx::query("SELECT substring(id::text, 1, 8) as run_id, status::text, created_at FROM agent_runs WHERE issue_id::text LIKE 'ec3365f4%' ORDER BY created_at")
        .fetch_all(&pool).await?;
    
    if rows.is_empty() {
        println!("  ℹ️  没有 run 关联到这个 task");
    } else {
        println!("  找到 {} 个关联的 runs:", rows.len());
        for (idx, row) in rows.iter().enumerate() {
            let run_id: String = row.try_get(0)?;
            let status: String = row.try_get(1)?;
            let created_at: chrono::DateTime<chrono::Utc> = row.try_get(2)?;
            println!("  {}. Run: {}, Status: {}, 创建时间: {}", 
                idx + 1, 
                run_id, 
                status,
                created_at.format("%Y-%m-%d %H:%M:%S")
            );
        }
    }

    println!();
    println!("📊 总结:");
    println!("{}", "=".repeat(80));
    println!("如果 bdbbb599 和 efcfeaf2 都关联到 ec3365f4，说明:");
    println!("  ⚠️  两个不同的 run 关联到了同一个 task");
    println!("  这可能导致:");
    println!("    - 两个 agent 同时处理同一个任务");
    println!("    - 任务状态冲突");
    println!("    - 重复的工作");

    Ok(())
}
