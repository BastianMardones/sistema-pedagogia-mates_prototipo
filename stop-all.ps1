# stop-all.ps1 - Detiene todos los servicios del Sistema de Gestion Pedagogica
# Uso: .\stop-all.ps1

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " SGP Matematicas - Deteniendo servicios" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Puertos a liberar: 3000 (Frontend), 8000 (Chatbot), 8081 (Backend)
$ports = @(3000, 8000, 8081)

foreach ($port in $ports) {
    $conns = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($conns) {
        $pids = $conns | Select-Object -ExpandProperty OwningProcess -Unique
        foreach ($p in $pids) {
            $proc = Get-Process -Id $p -ErrorAction SilentlyContinue
            if ($proc) {
                Write-Host "  -> Deteniendo servicio en puerto $port (PID: $p - $($proc.Name))..." -ForegroundColor Yellow
                Stop-Process -Id $p -Force -ErrorAction SilentlyContinue
            }
        }
    } else {
        Write-Host "  Puerto $port ya esta libre." -ForegroundColor Gray
    }
}

# Detener MariaDB si esta corriendo
$mysql = Get-Process -Name "mysqld" -ErrorAction SilentlyContinue
if ($mysql) {
    Write-Host "  -> Deteniendo MariaDB/MySQL (PID: $($mysql.Id))..." -ForegroundColor Yellow
    Stop-Process -Id $mysql.Id -Force -ErrorAction SilentlyContinue
} else {
    Write-Host "  MariaDB ya esta detenido." -ForegroundColor Gray
}

# Cerrar procesos node o java residuales si existen en la carpeta
Start-Sleep -Seconds 1

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host " Todos los servicios han sido detenidos." -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""