// The deck. hints are for the explainer only and must not share a root with the name.
// art describes the character: body + face (eyes, mouth, brows, blush) + props, see js/art.js.

export const CARDS = [
  {id:'heartburn', name:'Изжога', sys:'gut', hints:['Печёт в груди после еды','Кисло во рту','Виноваты шаурма и кофе'], art:{body:'stomach', eyes:'squeeze', mouth:'grimace', props:['flame']}},
  {id:'diarrhea', name:'Диарея', sys:'gut', hints:['Срочно нужен туалет','Бурлит в животе','Далеко от дома не уйти'], art:{body:'gut', eyes:'wide', mouth:'wavy', arms:'up', props:['sweat','tp']}},
  {id:'constipation', name:'Запор', sys:'gut', hints:['Сидишь в туалете часами','Живот как камень','Тужишься до красноты'], art:{body:'gut', color:'#F27C93', eyes:'squeeze', mouth:'grimace', props:['sweat','clock']}},
  {id:'bloating', name:'Вздутие', sys:'gut', hints:['Живот как воздушный шарик','Газы в самый неподходящий момент','Неловко в лифте'], art:{body:'blob', color:'#FF9DB0', r:60, eyes:'wide', mouth:'o', props:['puffs']}},
  {id:'hemorrhoids', name:'Геморрой', sys:'gut', hints:['Больно сидеть','Сидишь на подушке-бублике','Стесняешься сказать врачу'], art:{body:'ring', eyes:'tired', mouth:'wavy', props:['sweat']}},
  {id:'runny', name:'Насморк', sys:'lor', hints:['Течёт из носа ручьём','Нос не дышит','Гора бумажных платков'], art:{body:'nose', eyes:'tired', mouth:'frown', props:['drip','tissue']}},
  {id:'angina', name:'Ангина', sys:'lor', hints:['Больно глотать','Красное горло','Высокая температура'], art:{body:'head', eyes:'tired', mouth:'thermo', props:['scarf']}},
  {id:'snoring', name:'Храп', sys:'lor', hints:['Громкие звуки во сне','Соседи не высыпаются','Получаешь локтем в бок'], art:{body:'head', eyes:'closed', mouth:'o', blush:false, props:['nightcap','zzz']}},
  {id:'otitis', name:'Отит', sys:'lor', hints:['Стреляет в ухе','Плохо слышно: «А? Что?»','Тёплый платок на голову'], art:{body:'ear', eyes:'squeeze', mouth:'grimace', props:['bolt']}},
  {id:'cold', name:'Простуда', sys:'lor', hints:['Ломит всё тело','Сопли и кашель','Чай с малиной и под одеяло'], art:{body:'virus', eyes:'normal', brows:'evil', mouth:'grin', blush:false}},
  {id:'chickenpox', name:'Ветрянка', sys:'skin', hints:['Сыпь по всему телу','Всё чешется, а чесать нельзя','Мажут зелёнкой в горошек'], art:{body:'person', eyes:'normal', mouth:'wavy', props:['spots']}},
  {id:'sunburn', name:'Солнечный ожог', sys:'skin', hints:['Покраснел после пляжа','Больно надеть футболку','Кожа облезает'], art:{body:'person', color:'#FF8E7A', eyes:'tired', mouth:'grimace', arms:'up', props:['sun','peel']}},
  {id:'dandruff', name:'Перхоть', sys:'skin', hints:['Белые хлопья на плечах','Чешется голова','Не наденешь тёмный пиджак'], art:{body:'head', eyes:'normal', mouth:'frown', brows:'worried', props:['hair','flakes']}},
  {id:'callus', name:'Мозоль', sys:'skin', hints:['Натёрли новые туфли','Больно ходить','Спасает пластырь'], art:{body:'foot', eyes:'teary', mouth:'grimace', props:['plaster']}},
  {id:'migraine', name:'Мигрень', sys:'head', hints:['Пульсирует полголовы','Бесят свет и звуки','Лежишь в тёмной комнате'], art:{body:'brain', eyes:'squeeze', mouth:'grimace', arms:'up', props:['bolt']}},
  {id:'seasick', name:'Морская болезнь', sys:'head', hints:['Укачивает на лодке','Тошнит','Лицо зелёного цвета'], art:{body:'head', color:'#B9E68A', eyes:'dizzy', mouth:'wavy', props:['wave']}},
  {id:'insomnia', name:'Бессонница', sys:'head', hints:['Ворочаешься до утра','Считаешь овец','Днём зеваешь'], art:{body:'eye', lid:'none', props:['veins','moon']}},
  {id:'stye', name:'Ячмень', sys:'face', hints:['Опухло веко','Больно моргать','Показывают кукиш'], art:{body:'eye', lid:'half', props:['bump']}},
  {id:'caries', name:'Кариес', sys:'face', hints:['Дырка в зубе','Ноет от сладкого','Страшно идти к стоматологу'], art:{body:'tooth', eyes:'teary', mouth:'frown', props:['hole']}},
  {id:'conjunct', name:'Конъюнктивит', sys:'face', hints:['Красные глаза','Слезятся','Слипаются по утрам'], art:{body:'eye', lid:'low', iris:'#6BBF59', props:['veins','tears']}},
  {id:'sciatica', name:'Радикулит', sys:'bones', hints:['Прострел в пояснице','Не разогнуться','Пояс из собачьей шерсти'], art:{body:'bone', eyes:'squeeze', mouth:'grimace', props:['belt','bolt'], boltAt:[150,96]}},
  {id:'sprain', name:'Растяжение', sys:'bones', hints:['Подвернул ногу','Опухла лодыжка','Лёд и покой'], art:{body:'foot', eyes:'tired', mouth:'frown', props:['bandage','icepack']}},
  {id:'hangover', name:'Похмелье', sys:'misc', hints:['Утром раскалывается голова','Сушняк','Стыдно за вчерашнее'], art:{body:'liver', eyes:'dizzy', mouth:'wavy', props:['icepack']}},
  {id:'catallergy', name:'Аллергия на кошек', sys:'misc', hints:['Чихаешь, когда рядом мурлычут','Глаза слезятся','Пушистый виновник доволен'], art:{body:'nose', color:'#FF9C8A', eyes:'teary', mouth:'o', props:['cat']}},
  {id:'hiccups', name:'Икота', sys:'misc', hints:['Дёргаешься каждые пару секунд','Не помогает стакан воды','Пытаются напугать, чтобы прошло'], art:{body:'blob', color:'#FFC2D1', eyes:'wide', mouth:'o', props:['hic']}},
];

export const CARD = Object.fromEntries(CARDS.map(c => [c.id, c]));
