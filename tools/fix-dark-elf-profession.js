// Скрипт для виправлення професії Dark Elf Mystic героїв
// Запускати в браузерній консолі на сторінці гри
// Скопіюйте весь код і вставте в консоль браузера (F12 -> Console)

(function fixDarkElfProfession() {
  try {
    // Читаємо аккаунти
    const accountsStr = localStorage.getItem("l2_accounts_v2");
    if (!accountsStr) {
      console.error("❌ Не знайдено аккаунтів в localStorage");
      return;
    }

    const accounts = JSON.parse(accountsStr);
    if (!Array.isArray(accounts) || accounts.length === 0) {
      console.error("❌ Аккаунти не знайдено або порожній масив");
      return;
    }

    let fixed = 0;
    let checked = 0;

    // Перевіряємо кожен аккаунт
    accounts.forEach((acc, accIndex) => {
      if (!acc.hero) return;
      
      const hero = acc.hero;
      const race = (hero.race || "").toLowerCase();
      const klass = (hero.klass || "").toLowerCase();
      const currentProfession = (hero.profession || "").toLowerCase();
      const level = hero.level || 1;

      // Перевіряємо, чи це Dark Elf
      const isDarkElf = 
        race.includes("dark") || 
        race.includes("тёмный") || 
        race.includes("темный") ||
        race.includes("темний");

      // Перевіряємо, чи це Mystic
      const isMystic = 
        klass.includes("mystic") || 
        klass.includes("маг") ||
        currentProfession.includes("mystic");

      if (isDarkElf && isMystic) {
        checked++;
        
        // Визначаємо правильну професію залежно від рівня
        let correctProfession = "dark_mystic_base";
        if (level >= 40) {
          correctProfession = "dark_mystic_shillien_elder";
        } else if (level >= 20) {
          correctProfession = "dark_mystic_oracle";
        }

        // Якщо професія відсутня або неправильна (наприклад, human_mystic_*)
        const needsFix = 
          !hero.profession || 
          currentProfession !== correctProfession ||
          currentProfession.includes("human_mystic");

        if (needsFix) {
          console.log(`🔧 Виправляю героя "${hero.name || acc.username}":`);
          console.log(`   Раса: ${hero.race}, Клас: ${hero.klass}`);
          console.log(`   Рівень: ${level}`);
          console.log(`   Стара професія: ${hero.profession || "(відсутня)"}`);
          console.log(`   Нова професія: ${correctProfession}`);

          // Оновлюємо професію
          accounts[accIndex].hero.profession = correctProfession;
          fixed++;
        } else {
          console.log(`✅ Герой "${hero.name || acc.username}" має правильну професію: ${correctProfession}`);
        }
      }
    });

    // Зберігаємо зміни
    if (fixed > 0) {
      localStorage.setItem("l2_accounts_v2", JSON.stringify(accounts));
      console.log(`\n✅ Виправлено ${fixed} героїв з ${checked} перевірених Dark Elf Mystic`);
      console.log("🔄 Перезавантажте сторінку для застосування змін");
    } else if (checked > 0) {
      console.log(`\n✅ Всі ${checked} Dark Elf Mystic герої мають правильні професії`);
    } else {
      console.log("\n⚠️ Не знайдено Dark Elf Mystic героїв для перевірки");
      console.log("💡 Перевірте, чи правильно встановлена раса героя (має бути 'Dark Elf')");
    }

  } catch (error) {
    console.error("❌ Помилка при виправленні професій:", error);
  }
})();

