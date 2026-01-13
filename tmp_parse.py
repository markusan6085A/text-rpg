import re, html
from pathlib import Path
text = Path('src/data/skills/маг-скли/Cleric - База знаний Л2.htm').read_text(encoding='utf-8', errors='ignore')
text = html.unescape(text)
skills = ['Heal','Battle Heal','Group Heal','Shield','Might','Anti Magic','Weapon Mastery']
for name in skills:
    print('===', name)
    pattern = re.compile(rf"{name} lv\.\s*([0-9]+).*?<br/>\s*([0-9 ]+) SP.*?Расход MP:<br/>\s*([^<]+)<br/>.*?Power ([0-9]+)", re.S|re.I)
    for m in pattern.finditer(text):
        lv = int(m.group(1)); sp = int(m.group(2)); mp = int(m.group(3).split()[0]); power = int(m.group(4));
        print(lv, sp, mp, power)
