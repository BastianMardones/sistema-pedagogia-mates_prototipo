# start-all.ps1 - Inicia todos los servicios del Sistema de Gestion Pedagogica
# Uso: .\start-all.ps1

$root = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " SGP Matematicas - Iniciando servicios" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
# 0. Liberar puertos si quedaron procesos anteriores
$portsToCheck = @(3000, 8000, 8081)
foreach ($port in $portsToCheck) {
    $conn = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    if ($conn) {
        $conn | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object {
            Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue
        }
    }
}

# 1. Iniciar Base de Datos (MariaDB XAMPP en puerto 3306)
Write-Host "[1/4] Verificando Base de Datos MySQL/MariaDB (puerto 3306)..." -ForegroundColor Green
$mysqlConn = Get-NetTCPConnection -LocalPort 3306 -State Listen -ErrorAction SilentlyContinue
if (-not $mysqlConn) {
    Write-Host "  Iniciando MariaDB..." -ForegroundColor Yellow
    Start-Process -FilePath "C:\xampp\mysql\bin\mysqld.exe" -ArgumentList "--defaults-file=C:\xampp\mysql\bin\my.ini --standalone" -WorkingDirectory "C:\xampp\mysql\bin" -WindowStyle Hidden
    Start-Sleep -Seconds 3
} else {
    Write-Host "  MariaDB ya esta corriendo en el puerto 3306." -ForegroundColor Gray
}

# 2. Iniciar Backend Spring Boot (puerto 8081)
Write-Host "[2/4] Iniciando Backend Spring Boot (puerto 8081)..." -ForegroundColor Green
$backendScript = @"
`$java21Home = 'C:\Users\Antonio\.jdks\openjdk-21.0.2'
`$env:JAVA_HOME = `$java21Home
`$env:PATH = 'C:\Users\Antonio\.gemini\antigravity\scratch\tools\apache-maven-3.9.9\bin;' + `$java21Home + '\bin;' + [System.Environment]::GetEnvironmentVariable('PATH','Machine')
cd '$root\backend'
mvn spring-boot:run --no-transfer-progress
"@
Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendScript -WindowStyle Normal

Start-Sleep -Seconds 2

# 3. Iniciar Chatbot Python FastAPI (puerto 8000)
Write-Host "[3/4] Iniciando Chatbot Python (puerto 8000)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\chatbot'; python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload" -WindowStyle Normal

Start-Sleep -Seconds 2

# 4. Iniciar Frontend Next.js (puerto 3000)
Write-Host "[4/4] Iniciando Frontend Next.js (puerto 3000)..." -ForegroundColor Green
$frontendScript = @"
`$env:PATH = [System.Environment]::GetEnvironmentVariable('PATH','Machine') + ';' + [System.Environment]::GetEnvironmentVariable('PATH','User')
cd '$root\frontend'
npm run dev
"@
Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendScript -WindowStyle Normal

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " Servicios iniciados:" -ForegroundColor Cyan
Write-Host "  Frontend:  http://localhost:3000" -ForegroundColor White
Write-Host "  Backend:   http://localhost:8081" -ForegroundColor White  
Write-Host "  Chatbot:   http://localhost:8000" -ForegroundColor White
Write-Host "  Base Datos: localhost:3306 (pedagogia_db)" -ForegroundColor White
Write-Host "" 
Write-Host " Credenciales de prueba:" -ForegroundColor Cyan
Write-Host "  Estudiante: estudiante@pedagogia.cl / password" -ForegroundColor White
Write-Host "  Profesor:   profesor@pedagogia.cl / password" -ForegroundColor White
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Espera ~15 segundos para que los servicios inicialicen." -ForegroundColor Yellow
Write-Host "Luego abre en tu navegador: http://localhost:3000" -ForegroundColor Green