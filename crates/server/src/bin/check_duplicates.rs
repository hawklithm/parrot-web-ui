use sqlx::PgPool;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenvy::dotenv().ok();
    let pool = PgPool::connect(&std::env::var("DATABASE_URL")?).await?;

    println!("🔍 检查违反唯一约束的重复 runs");
    println!("{}", "=".repeat(80));
    println!();

    let rows = sqlx::query(
        r#"
        SELECT 
            context_snapshot->>'issueId' as issue_id,
            COUNT(*) as active_run_count,
            string_agg(substring(id::text, 1, 8), ', ' ORDER BY created_at) as run_ids,
            string_agg(status::text, ', ' ORDER BY created_at) as statuses
        FROM heartbeat_runs
        WHERE status IN ('queued', 'running')
          AND context_snapshot->>'issueId' IS NOT NULL
        GROUP BY context_snapshot->>'issueId'
        HAVING COUNT(*) > 1
        ORDER BY active_run_count DESC
        "#
    )
    .fetch_all(&pool)
    .await?;

    if rows.is_empty() {
        println!("✅ 没有发现重复的活跃 runs");
        println!("   唯一约束可以正常工作。");
    } else {
        println!("⚠️  发现 {} 组重复的活跃 runs:", rows.len());
        println!();
        
        use sqlx::Row;
        for (idx, row) in rows.iter().enumerate() {
            let issue_id: Option<String> = row.try_get(0).ok();
            let count: i64 = row.try_get(1)?;
            let run_ids: String = row.try_get(2)?;
            let statuses: String = row.try_get(3)?;
            
            println!("{}. Issue: {}", idx + 1, issue_id.as_deref().unwrap_or("NULL"));
            println!("   活跃 run 数量: {}", count);
            println!("   Run IDs: {}", run_ids);
            println!("   Statuses: {}", statuses);
            println!();
        }
        
        println!("⚠️  这些重复的 runs 违反了新添加的唯一约束。");
        println!("   建议取消其中的一个 run 来清理数据。");
    }

    Ok(())
}
