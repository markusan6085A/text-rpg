// Скрипт для видалення невикористаних іконок з public/items/drops
const fs = require('fs');
const path = require('path');

const dropsPath = path.join(__dirname, '..', 'public', 'items', 'drops');
const codeFiles = [
  path.join(__dirname, '..', 'src', 'data', 'items', 'itemsDB.ts'),
  path.join(__dirname, '..', 'src', 'data', 'shop', 'ngGradeShop.ts'),
  path.join(__dirname, '..', 'src', 'data', 'shop', 'dGradeShop.ts'),
  path.join(__dirname, '..', 'src', 'data', 'shop', 'cGradeShop.ts'),
  path.join(__dirname, '..', 'src', 'data', 'shop', 'sGradeShop.ts'),
];

console.log('Збираю використані іконки з коду...\n');

const usedIcons = new Set();

// Функція для пошуку всіх іконок у файлі
function findIconsInFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`Файл не знайдено: ${filePath}`);
      return;
    }
    const content = fs.readFileSync(filePath, 'utf8');
    // Шукаємо всі шляхи /items/drops/...
    const regex = /\/items\/drops\/([^"'`\s\)\]]+)/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
      const iconName = match[1].trim();
      if (iconName) {
        usedIcons.add(iconName);
      }
    }
  } catch (error) {
    console.error(`Помилка при читанні ${filePath}:`, error.message);
  }
}

// Обробляємо основні файли
codeFiles.forEach(file => {
  findIconsInFile(file);
});

// Також шукаємо в інших файлах src
const srcPath = path.join(__dirname, '..', 'src');
function searchInDirectory(dir) {
  try {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        // Пропускаємо node_modules та інші служебні папки
        if (!['node_modules', '.git', 'dist', 'build'].includes(file)) {
          searchInDirectory(fullPath);
        }
      } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
        findIconsInFile(fullPath);
      }
    });
  } catch (error) {
    // Ігноруємо помилки доступу
  }
}

console.log('Шукаю іконки в src директорії...');
searchInDirectory(srcPath);

console.log(`Знайдено ${usedIcons.size} унікальних використаних іконок\n`);

// Отримуємо всі файли в папці drops
console.log(`Перевіряю файли в папці ${dropsPath}...\n`);
const allFiles = fs.readdirSync(dropsPath);
console.log(`Всього файлів: ${allFiles.length}`);

const toDelete = [];
allFiles.forEach(fileName => {
  if (!usedIcons.has(fileName)) {
    toDelete.push(fileName);
  }
});

console.log(`\nФайлів для видалення: ${toDelete.length}`);

if (toDelete.length === 0) {
  console.log('\n✅ Всі файли використовуються. Нічого видаляти.');
  process.exit(0);
}

console.log('\nПРИКЛАДИ файлів для видалення (перші 30):');
toDelete.slice(0, 30).forEach(file => {
  console.log(`  - ${file}`);
});

// Питаємо підтвердження
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Автоматично видаляємо без підтвердження
console.log(`\nВидаляю ${toDelete.length} невикористаних файлів...\n`);
let deleted = 0;
let errors = 0;

toDelete.forEach(fileName => {
  try {
    const filePath = path.join(dropsPath, fileName);
    fs.unlinkSync(filePath);
    deleted++;
    if (deleted % 500 === 0) {
      console.log(`Видалено ${deleted} файлів...`);
    }
  } catch (error) {
    errors++;
    console.error(`Помилка при видаленні ${fileName}:`, error.message);
  }
});

console.log(`\n✅ Готово! Видалено: ${deleted} файлів`);
if (errors > 0) {
  console.log(`❌ Помилок: ${errors}`);
}
console.log(`Залишилося файлів: ${allFiles.length - deleted}`);

