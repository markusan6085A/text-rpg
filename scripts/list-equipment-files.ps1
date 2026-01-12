# Скрипт для перегляду файлів екіпірування
# Використання: .\scripts\list-equipment-files.ps1

param(
    [string]$Race = "0",      # ID раси (0=Human, 10=Elf, 18=DarkElf, 25=Orc, 31=Dwarf)
    [string]$Gender = "male", # male або female
    [string]$View = "front"   # front, back, або top
)

$equipmentPath = "public\equipment\$View\$Race-$Gender"

Write-Host "=== Файли екіпірування ===" -ForegroundColor Cyan
Write-Host "Шлях: $equipmentPath" -ForegroundColor Yellow
Write-Host ""

if (Test-Path $equipmentPath) {
    $files = Get-ChildItem $equipmentPath -File | Sort-Object { [int]($_.BaseName) }
    
    Write-Host "Знайдено файлів: $($files.Count)" -ForegroundColor Green
    Write-Host ""
    Write-Host "Перші 50 файлів:" -ForegroundColor Cyan
    Write-Host "ID    | Назва файлу"
    Write-Host "------|------------"
    
    $files | Select-Object -First 50 | ForEach-Object {
        $id = $_.BaseName
        $name = $_.Name
        Write-Host "$id".PadRight(5) "| $name"
    }
    
    if ($files.Count -gt 50) {
        Write-Host ""
        Write-Host "... і ще $($files.Count - 50) файлів" -ForegroundColor Gray
    }
} else {
    Write-Host "Помилка: Папка не знайдена!" -ForegroundColor Red
    Write-Host "Перевірте шлях: $equipmentPath"
}

Write-Host ""
Write-Host "=== Використання ===" -ForegroundColor Cyan
Write-Host "Щоб подивитися іншу расу/стать:" -ForegroundColor Yellow
Write-Host "  .\scripts\list-equipment-files.ps1 -Race 10 -Gender female -View front"
Write-Host ""
Write-Host "Доступні раси:" -ForegroundColor Yellow
Write-Host "  0  = Human"
Write-Host "  10 = Elf"
Write-Host "  18 = Dark Elf"
Write-Host "  25 = Orc"
Write-Host "  31 = Dwarf"

