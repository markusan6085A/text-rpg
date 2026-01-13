// ПРОСТИЙ СКРИПТ ДЛЯ ВИПРАВЛЕННЯ ПРОФЕСІЇ В КОНСОЛІ БРАУЗЕРА
// Скопіюйте весь код і вставте в консоль (F12 -> Console)

(function() {
  try {
    const accounts = JSON.parse(localStorage.getItem("l2_accounts_v2") || "[]");
    const currentUser = JSON.parse(localStorage.getItem("l2_current_user") || "null");
    
    if (!currentUser) {
      console.error("❌ Не знайдено поточного користувача");
      return;
    }
    
    const account = accounts.find(a => a.username === currentUser);
    if (!account || !account.hero) {
      console.error("❌ Не знайдено героя");
      return;
    }
    
    const hero = account.hero;
    console.log("📊 Поточні дані героя:");
    console.log("  Раса:", hero.race);
    console.log("  Клас:", hero.klass);
    console.log("  Професія:", hero.profession || "(відсутня)");
    console.log("  Рівень:", hero.level);
    
    const race = (hero.race || "").toLowerCase();
    const isDarkElf = race.includes("dark") || race.includes("темный") || race.includes("темний");
    const klass = (hero.klass || "").toLowerCase();
    const isMystic = klass.includes("mystic") || klass.includes("маг");
    
    if (isDarkElf && isMystic) {
      let correctProfession = "dark_mystic_base";
      if (hero.level >= 40) {
        correctProfession = "dark_mystic_shillien_elder";
      } else if (hero.level >= 20) {
        correctProfession = "dark_mystic_oracle";
      }
      
      const currentProf = (hero.profession || "").toLowerCase();
      const needsFix = !hero.profession || 
                       currentProf !== correctProfession ||
                       currentProf.includes("human_mystic");
      
      if (needsFix) {
        console.log("\n🔧 Виправляю професію:");
        console.log("  Стара:", hero.profession || "(відсутня)");
        console.log("  Нова:", correctProfession);
        
        const accountIndex = accounts.findIndex(a => a.username === currentUser);
        accounts[accountIndex].hero.profession = correctProfession;
        localStorage.setItem("l2_accounts_v2", JSON.stringify(accounts));
        
        console.log("\n✅ Професію виправлено! Перезавантажте сторінку.");
      } else {
        console.log("\n✅ Професія вже правильна:", correctProfession);
      }
    } else {
      console.log("\n⚠️ Це не Dark Elf Mystic герой");
      console.log("  isDarkElf:", isDarkElf);
      console.log("  isMystic:", isMystic);
    }
  } catch (error) {
    console.error("❌ Помилка:", error);
  }
})();


