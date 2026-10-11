/* Small code-native pixel UI icons. Island artwork is a separate generated asset. */
window.pixelIcon=(name,size=24)=>{
 const colors={o:'#67567d',p:'#f5b0c5',m:'#a9d7b8',y:'#ffe7a0',w:'#fff9e7',b:'#a9cbe9',l:'#c3b3e5',d:'#ad7594'};
 const icons={
 bunny:['...oo...oo......','..owwo.owwo.....','..owpo.owpo.....','..owpo.owpo.....','..owwo.owwo.....','..owwwowwwo.....','.owwwwwwwwwo....','owwwwwwwwwwwo...','owwowwwwowwwo...','owwowwwwowwwo...','owppwddwppwwo...','.owwwwwwwwwo....','..ooooooooo.....'],
 cat:['..oo.....oo.....','..opoo.oolo.....','..oppooollo.....','..opwwwwwlo.....','.owwwwwwwwwo....','owwwwwwwwwwwo...','owwowwwwowwwo...','owwowwwwowwwo...','owppwddwppwwo...','.owwwwwwwwwo....','..ooooooooo.....'],
 heart:['..oo..oo..','.oppooppo.','oppppppppo','oppppppppo','.opppppo..','..opppo...','...opo....','....o.....'],
 star:['....oo....','....oy....','...oyyo...','ooooyyoooo','oyyyyyyyyo','.oyyyyyyo.','..oyyyyo..','.oyyooyyo.','.ooo..ooo.'],
 plane:['.....oo.....','.....owo....','..o..owwo...','.owooowwwo..','owwwwwwwwwo.','.owooowwwo..','..o..owwo...','.....owo....','.....oo.....'],
 bag:['...ooooo....','...owwwo....','.ooooooooo..','.oyyyyyyyo..','.oyowwoyyo..','.oyowwoyyo..','.oyyyyyyyo..','.oyyyyyyyo..','.ooooooooo..','..oo...oo...'],
 map:['.ooo..ooo...','ommoooyyyo..','ommmobyyyo..','ommmoboyyo..','ommmobyyyo..','ommmobyyyo..','ommmobyyyo..','.ooo..ooo...'],
 book:['..oooooooo..','.opppppppo..','opppppppoo..','opwwppppoo..','opwwppppoo..','opppppppoo..','oooooooooo..','owwwwwwwwo..','.oooooooo...'],
 check:['........oo..','.......omo..','......omo...','.oo..omo....','ommoomo.....','.ommmo......','..omo.......','...o........'],
 save:['.oooooooooo.','.olowwwoloo.','.olowwwoloo.','.oloooooolo.','.ollllllllo.','.oloooooolo.','.olowwwwolo.','.olowwwwolo.','.oooooooooo.'],
 paw:['..oo..oo....','.oppooppo...','.oppooppo...','..oo..oo....','....oo......','..ooppoo....','.oppppppo...','.oppppppo...','..oooooo....'],
 fish:['....oooo....','..oobbbboo..','.obbbobbboo.','obbbbbbbbboo','.obbbbbbbboo','..oobbbboo..','....oooo....'],
 bed:['oo..........','owo.........','owooooooo...','owowwwpppo..','owowwwpppo..','owooooooo...','owwwwwwwwo..','oooooooooo..','oo......oo..'],
 palm:['....ooo.....','..oommmoo...','.ommmmmmo...','ommmoommmo..','.oo.oo.oo...','....oyo.....','....oyo.....','...oyyo.....','..oooooo....'],
 castle:['.o..o..o..o.','.oyooyooyoo.','.oyyyyyyyyo.','.oyoyyoyyyo.','.oyyyyyyyyo.','.oyyyoooyyo.','.oyyyowoyyo.','oooooooooooo'],
 food:['...o..o.....','..o..o......','...o..o.....','............','ooooooooooo.','obwwwwwbwbo.','.obwwwwbo...','..obbbbo....','...oooo.....'],
 flower:['....ooo.....','...opppo....','.ooopppooo..','opppoyopppo.','opppyyypppo.','.ooopppooo..','...opppo....','....ooo.....','....omo.....','..ommmo.....'],
 boat:['.....oo.....','....owo.....','...owwo.....','..owwwo.....','.owwwwo.....','ooooooo.....','.oyyyyyyyo..','..ooooooo...','.bb..bb..bb.'],
 cable:['oooooooooooo','.....o......','....ooo.....','..ooooooo...','.opppppppo..','.opobboppo..','.opobboppo..','.opooooopo..','..ooooooo...'],
 sun:['....o.......','..o.y.o.....','...ooo......','.oyyyyo.....','oyyyyyyo....','.oyyyyo.....','...ooo......','..o.y.o.....','....o.......'],
 car:['...oooooo...','..obwwwwo...','.obwwwwwbo..','ooooooooooo.','olllllllllo.','olwwlllwwlo.','ooooooooooo.','..oo...oo...'],
 walk:['.....oo.....','....oyyo....','.....oo.....','....oloo....','...ololo....','..ooo.lo....','....oo.o....','...ol..ol...','..oo....oo..'],
 ticket:['.oooooooooo.','oyyyyollllo.','oyoyooolllo.','.oyyyolllo..','oyoyooolllo.','oyyyyollllo.','.oooooooooo.'],
 camera:['...oooo.....','..ollllo....','ooooooooooo.','olllllllloo.','ollooooollo.','ollobboollo.','ollooooollo.','ooooooooooo.'],
 folder:['.oooo.......','oyyyoooooo..','oyyyyyyyyo..','ooooooooooo.','owwwwwwwwwo.','owwwwwwwwwo.','owwwwwwwwwo.','ooooooooooo.']
 };
 const rows=icons[name]||icons.star,width=Math.max(...rows.map(x=>x.length));
 return `<svg class="pixel-icon" width="${size}" height="${size}" viewBox="0 0 ${width} ${Math.max(width,rows.length)}" aria-hidden="true" shape-rendering="crispEdges">${rows.map((row,y)=>[...row].map((c,x)=>colors[c]?`<rect x="${x}" y="${y}" width="1" height="1" fill="${colors[c]}"/>`:'').join('')).join('')}</svg>`;
};
document.querySelectorAll('[data-icon]').forEach(el=>el.innerHTML=window.pixelIcon(el.dataset.icon,Number(el.dataset.size)||24));
