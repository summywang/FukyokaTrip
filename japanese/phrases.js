/* Travel Japanese for the 2027 Kyushu trip. Static data only: no accounts, API keys or network requests.
   Kanji carry furigana as {漢字|かな}. Every phrase has Japanese, Hepburn romaji and Traditional Chinese.
   ○○ marks a blank the traveller fills in aloud (for example the booking name). */
(function(root){
 'use strict';
 const p=(ja,ro,zh,reply)=>reply?{ja,ro,zh,reply}:{ja,ro,zh};
 const w=(ja,ro,zh,tag)=>tag?{ja,ro,zh,tag}:{ja,ro,zh};
 const OK=p("わかりました。","Wakarimashita.","知道了。");
 const HERE=p("はい、これです。","Hai, kore desu.","有，在這裡。");
 const PLEASE=p("はい、どうぞ。","Hai, dōzo.","好的，請看。");
 const YES_PLEASE=p("お{願|ねが}いします。","Onegai shimasu.","要，麻煩了。");
 const NO_THANKS=p("いいえ、{大丈夫|だいじょうぶ}です。","Iie, daijōbu desu.","不用了，謝謝。");
 const PARTY=p("{大人|おとな}{5人|ごにん}と{赤|あか}ちゃん{1人|ひとり}です。","Otona gonin to akachan hitori desu.","五位大人和一個寶寶。");
 const BOOKED=p("{予約|よやく}した○○です。","Yoyaku shita ○○ desu.","我是有預約的○○。");
 const CARD=p("カードで{払|はら}えますか？","Kādo de haraemasu ka?","可以刷卡嗎？");
 const BAG=p("{袋|ふくろ}はご{利用|りよう}ですか？","Fukuro wa goriyō desu ka?","需要袋子嗎？",[YES_PLEASE,p("いりません。","Irimasen.","不用。")]);

 // The vegetarian explanation shown to restaurant staff. Egg, dairy, shared cookware and head count
 // are not confirmed yet, so those lines appear only after the traveller sets them on the phone.
 const diet={
  opening:p("すみません。{食事|しょくじ}についてのお{願|ねが}いです。","Sumimasen. Shokuji ni tsuite no onegai desu.","不好意思，想拜託一下關於餐點的事。"),
  who:{
   unset:p("{私|わたし}たちの{中|なか}に、ベジタリアンがいます。","Watashitachi no naka ni, bejitarian ga imasu.","我們之中有素食者。"),
   counts:{1:["{1人|ひとり}","hitori"],2:["{2人|ふたり}","futari"],3:["{3人|さんにん}","sannin"],4:["{4人|よにん}","yonin"],5:["{5人|ごにん}","gonin"]}
  },
  core:[
   p("{肉|にく}・{魚|さかな}・{魚介類|ぎょかいるい}（えび・かに・{貝|かい}など）は{食|た}べられません。","Niku, sakana, gyokairui (ebi, kani, kai nado) wa taberaremasen.","不能吃肉、魚和海鮮（蝦、蟹、貝類等）。"),
   p("かつお{節|ぶし}・{煮干|にぼ}し・{鶏|とり}ガラ・{豚骨|とんこつ}など、{肉|にく}や{魚|さかな}からとっただしやスープも{食|た}べられません。","Katsuobushi, niboshi, torigara, tonkotsu nado, niku ya sakana kara totta dashi ya sūpu mo taberaremasen.","用柴魚、小魚乾、雞骨、豬骨等肉或魚熬的高湯和湯也不能吃。"),
   p("オイスターソース・{魚醤|ぎょしょう}・ラード・コンソメなど、{動物性|どうぶつせい}の{調味料|ちょうみりょう}も{使|つか}わないでいただけると{助|たす}かります。","Oisutā sōsu, gyoshō, rādo, konsome nado, dōbutsusei no chōmiryō mo tsukawanaide itadakeru to tasukarimasu.","蠔油、魚露、豬油、高湯塊等動物性調味料，也請不要使用。"),
   p("ネギ・ニンニク・ニラ・{玉|たま}ねぎは{大丈夫|だいじょうぶ}です。","Negi, ninniku, nira, tamanegi wa daijōbu desu.","蔥、蒜、韭菜、洋蔥都可以。")
  ],
  egg:{
   ok:p("{卵|たまご}は{食|た}べられます。","Tamago wa taberaremasu.","蛋可以吃。"),
   no:p("{卵|たまご}も{食|た}べられません。","Tamago mo taberaremasen.","蛋也不能吃。")
  },
  dairy:{
   ok:p("{牛乳|ぎゅうにゅう}・チーズ・バターなどの{乳製品|にゅうせいひん}は{食|た}べられます。","Gyūnyū, chīzu, batā nado no nyūseihin wa taberaremasu.","牛奶、起司、奶油等乳製品可以吃。"),
   no:p("{牛乳|ぎゅうにゅう}・チーズ・バターなどの{乳製品|にゅうせいひん}も{食|た}べられません。","Gyūnyū, chīzu, batā nado no nyūseihin mo taberaremasen.","牛奶、起司、奶油等乳製品也不能吃。")
  },
  shared:{
   ok:p("{同|おな}じ{鍋|なべ}や{油|あぶら}で{調理|ちょうり}しても{大丈夫|だいじょうぶ}です。","Onaji nabe ya abura de chōri shite mo daijōbu desu.","用同一個鍋子或油烹調也沒關係。"),
   separate:p("できれば、{肉|にく}や{魚|さかな}とは{別|べつ}の{鍋|なべ}と{油|あぶら}で{調理|ちょうり}していただけますか。","Dekireba, niku ya sakana to wa betsu no nabe to abura de chōri shite itadakemasu ka.","可以的話，請用和肉、魚分開的鍋子和油烹調。")
  },
  closing:[
   p("この{条件|じょうけん}で{食|た}べられるメニューはありますか？","Kono jōken de taberareru menyū wa arimasu ka?","有符合這些條件、可以吃的菜嗎？"),
   p("{難|むずか}しい{場合|ばあい}は、{遠慮|えんりょ}なくおっしゃってください。","Muzukashii baai wa, enryo naku osshatte kudasai.","如果有困難，請直接告訴我們，不用客氣。")
  ]
 };

 const scenarios=[
  {id:'immigration',title:'機場入境',chip:'入境',mark:'入',reading:'にゅう',sections:[
   {type:'say',items:[
    p("{観光|かんこう}です。","Kankō desu.","來觀光。"),
    p("{家族|かぞく}{旅行|りょこう}です。","Kazoku ryokō desu.","家庭旅行。"),
    p("{4泊|よんはく}です。","Yonhaku desu.","住四晚。"),
    p("{住所|じゅうしょ}はこちらです。","Jūsho wa kochira desu.","地址在這裡。（給對方看住宿地址）"),
    p("ベビーカーはどこで{受|う}け{取|と}れますか？","Bebīkā wa doko de uketoremasu ka?","推車在哪裡領？"),
    p("{荷物|にもつ}が{出|で}てきません。","Nimotsu ga dete kimasen.","我的行李沒有出來。")
   ]},
   {type:'hear',items:[
    p("パスポートを{見|み}せてください。","Pasupōto o misete kudasai.","請出示護照。",[PLEASE]),
    p("{入国|にゅうこく}の{目的|もくてき}は{何|なん}ですか？","Nyūkoku no mokuteki wa nan desu ka?","入境目的是什麼？",[p("{観光|かんこう}です。","Kankō desu.","來觀光。")]),
    p("{何日|なんにち}{滞在|たいざい}しますか？","Nannichi taizai shimasu ka?","要停留幾天？",[p("{5日間|いつかかん}です。","Itsukakan desu.","五天。")]),
    p("どこに{泊|と}まりますか？","Doko ni tomarimasu ka?","住在哪裡？",[p("{福岡|ふくおか}{市内|しない}です。{住所|じゅうしょ}はこちらです。","Fukuoka shinai desu. Jūsho wa kochira desu.","在福岡市區，地址在這裡。")]),
    p("{申告|しんこく}するものはありますか？","Shinkoku suru mono wa arimasu ka?","有要申報的東西嗎？",[p("ありません。","Arimasen.","沒有。")]),
    p("QRコードを{見|み}せてください。","Kyū āru kōdo o misete kudasai.","請出示 QR code（Visit Japan Web）。",[HERE])
   ]}
  ]},
  {id:'rental',title:'租車取車與還車',chip:'租車',mark:'車',reading:'くるま',sections:[
   {type:'say',title:'取車',items:[
    p("{今|いま}、{空港|くうこう}に{着|つ}きました。","Ima, kūkō ni tsukimashita.","我們現在到機場了。（打給租車公司）"),
    p("{送迎|そうげい}バスはどこで{待|ま}てばいいですか？","Sōgei basu wa doko de mateba ii desu ka?","接駁車要在哪裡等？"),
    p("{予約|よやく}している○○です。","Yoyaku shite iru ○○ desu.","我是有預約的○○。"),
    p("チャイルドシートは{付|つ}いていますか？","Chairudo shīto wa tsuite imasu ka?","有裝兒童安全座椅嗎？"),
    p("{冬用|ふゆよう}タイヤですか？","Fuyuyō taiya desu ka?","是冬季輪胎嗎？"),
    p("ETCカードは{使|つか}えますか？","Ī tī shī kādo wa tsukaemasu ka?","可以用 ETC 卡嗎？"),
    p("{傷|きず}を{一緒|いっしょ}に{確認|かくにん}してください。","Kizu o issho ni kakunin shite kudasai.","請一起確認車上的刮傷。")
   ]},
   {type:'say',title:'還車',items:[
    p("{車|くるま}を{返|かえ}しに{来|き}ました。","Kuruma o kaeshi ni kimashita.","我們來還車。"),
    p("ガソリンは{満|まん}タンにしました。","Gasorin wa mantan ni shimashita.","油已經加滿了。"),
    p("{国際線|こくさいせん}ターミナルまで{送|おく}っていただけますか？","Kokusaisen tāminaru made okutte itadakemasu ka?","可以送我們到國際線航廈嗎？")
   ]},
   {type:'hear',items:[
    p("{免許証|めんきょしょう}を{見|み}せてください。","Menkyoshō o misete kudasai.","請出示駕照。",[p("{台湾|たいわん}の{免許証|めんきょしょう}と{日本語|にほんご}{翻訳文|ほんやくぶん}です。","Taiwan no menkyoshō to nihongo hon'yakubun desu.","這是台灣駕照和日文譯本。")]),
    p("{保険|ほけん}はどうされますか？","Hoken wa dō saremasu ka?","保險要怎麼選？",[p("{予約|よやく}の{内容|ないよう}のままでお{願|ねが}いします。","Yoyaku no naiyō no mama de onegai shimasu.","照預約的內容就好。")]),
    p("{満|まん}タンで{返|かえ}してください。","Mantan de kaeshite kudasai.","請加滿油再還車。",[OK]),
    p("ガソリンスタンドのレシートはありますか？","Gasorin sutando no reshīto wa arimasu ka?","有加油站的收據嗎？",[HERE])
   ]}
  ]},
  {id:'driving',title:'開車與停車',chip:'開車停車',mark:'道',reading:'みち',sections:[
   {type:'read',title:'路標與停車場',items:[
    w("{止|と}まれ","Tomare","停（紅色倒三角形，先停再開）"),
    w("{一方通行|いっぽうつうこう}","Ippō tsūkō","單行道"),
    w("{徐行|じょこう}","Jokō","慢行"),
    w("{満車|まんしゃ}","Mansha","停車場已滿"),
    w("{空車|くうしゃ}","Kūsha","有空位"),
    w("{入口|いりぐち}・{出口|でぐち}","Iriguchi / deguchi","入口／出口"),
    w("{駐車券|ちゅうしゃけん}","Chūshaken","停車券"),
    w("{精算機|せいさんき}","Seisanki","停車繳費機")
   ]},
   {type:'say',items:[
    p("この{近|ちか}くに{駐車場|ちゅうしゃじょう}はありますか？","Kono chikaku ni chūshajō wa arimasu ka?","這附近有停車場嗎？"),
    p("ここに{車|くるま}を{停|と}めてもいいですか？","Koko ni kuruma o tomete mo ii desu ka?","車可以停在這裡嗎？"),
    p("{駐車場|ちゅうしゃじょう}の{割引|わりびき}はありますか？","Chūshajō no waribiki wa arimasu ka?","停車有折抵嗎？（購物、用餐後問）"),
    p("{道|みち}に{迷|まよ}いました。","Michi ni mayoimashita.","我們迷路了。")
   ]},
   {type:'hear',items:[
    p("{駐車券|ちゅうしゃけん}はお{持|も}ちですか？","Chūshaken wa omochi desu ka?","有停車券嗎？",[HERE])
   ]}
  ]},
  {id:'lodging',title:'入住與退房',chip:'入住退房',mark:'宿',reading:'やど',sections:[
   {type:'say',items:[
    p("チェックインをお{願|ねが}いします。","Chekkuin o onegai shimasu.","麻煩辦理入住。"),
    BOOKED,
    p("{駐車場|ちゅうしゃじょう}はどこですか？","Chūshajō wa doko desu ka?","停車場在哪裡？"),
    p("{荷物|にもつ}を{預|あず}かっていただけますか？","Nimotsu o azukatte itadakemasu ka?","可以幫我們寄放行李嗎？"),
    p("ベビーベッドはありますか？","Bebī beddo wa arimasu ka?","有嬰兒床嗎？"),
    p("Wi-Fiのパスワードを{教|おし}えてください。","Waifai no pasuwādo o oshiete kudasai.","請告訴我 Wi-Fi 密碼。"),
    p("チェックアウトをお{願|ねが}いします。","Chekkuauto o onegai shimasu.","麻煩辦理退房。")
   ]},
   {type:'hear',items:[
    p("お{名前|なまえ}をお{願|ねが}いします。","Onamae o onegai shimasu.","請問大名？",[p("○○です。","○○ desu.","我是○○。")]),
    p("パスポートを{拝見|はいけん}します。","Pasupōto o haiken shimasu.","我看一下護照。",[PLEASE]),
    p("{朝食|ちょうしょく}は{何時|なんじ}になさいますか？","Chōshoku wa nanji ni nasaimasu ka?","早餐要幾點？",[p("{8時|はちじ}でお{願|ねが}いします。","Hachiji de onegai shimasu.","八點，麻煩了。")]),
    p("{鍵|かぎ}はこちらです。","Kagi wa kochira desu.","這是鑰匙。")
   ]}
  ]},
  {id:'restaurant',title:'餐廳用餐與素食說明',chip:'用餐・素食',mark:'食',reading:'しょく',sections:[
   {type:'diet'},
   {type:'say',items:[
    PARTY,
    BOOKED,
    p("{子|こ}ども{用|よう}の{椅子|いす}はありますか？","Kodomo-yō no isu wa arimasu ka?","有兒童椅嗎？"),
    p("ベビーカーのまま{入|はい}れますか？","Bebīkā no mama hairemasu ka?","推車可以直接推進去嗎？"),
    p("これには{肉|にく}や{魚|さかな}が{入|はい}っていますか？","Kore ni wa niku ya sakana ga haitte imasu ka?","這道有放肉或魚嗎？"),
    p("このスープは{何|なに}でだしをとっていますか？","Kono sūpu wa nani de dashi o totte imasu ka?","這個湯的高湯是用什麼熬的？"),
    p("{味噌汁|みそしる}にかつおだしは{入|はい}っていますか？","Misoshiru ni katsuo dashi wa haitte imasu ka?","味噌湯裡有柴魚高湯嗎？"),
    p("{昆布|こんぶ}だしだけで{作|つく}っていただけますか？","Konbu dashi dake de tsukutte itadakemasu ka?","可以只用昆布高湯來做嗎？"),
    p("{肉|にく}と{魚|さかな}を{抜|ぬ}いていただけますか？","Niku to sakana o nuite itadakemasu ka?","可以去掉肉和魚嗎？"),
    p("{取|と}り{皿|ざら}をいただけますか？","Torizara o itadakemasu ka?","可以給我們小盤子嗎？"),
    p("お{会計|かいけい}をお{願|ねが}いします。","Okaikei o onegai shimasu.","麻煩結帳。"),
    CARD
   ]},
   {type:'hear',items:[
    p("{何名様|なんめいさま}ですか？","Nanmei-sama desu ka?","請問幾位？",[PARTY]),
    p("ご{予約|よやく}はされていますか？","Goyoyaku wa sarete imasu ka?","請問有訂位嗎？",[p("はい、○○で{予約|よやく}しています。","Hai, ○○ de yoyaku shite imasu.","有，用○○的名字訂的。"),p("いいえ、していません。","Iie, shite imasen.","沒有。")]),
    p("ただいま{満席|まんせき}です。","Tadaima manseki desu.","現在客滿。",[p("どのくらい{待|ま}ちますか？","Dono kurai machimasu ka?","大概要等多久？")]),
    p("ご{注文|ちゅうもん}はお{決|き}まりですか？","Gochūmon wa okimari desu ka?","決定好要點什麼了嗎？",[p("もう{少|すこ}し{待|ま}ってください。","Mō sukoshi matte kudasai.","請再等一下。")]),
    p("ラストオーダーです。","Rasuto ōdā desu.","最後點餐時間到了。",[NO_THANKS]),
    p("お{会計|かいけい}はレジでお{願|ねが}いします。","Okaikei wa reji de onegai shimasu.","請到收銀台結帳。")
   ]}
  ]},
  {id:'konbini',title:'超商與成分表',chip:'超商成分表',mark:'材',reading:'ざい',intro:'看包裝上的「原材料名」和「アレルギー物質」。紅色不行、黃色要問清楚、綠色通常可以；蛋和奶依你在「餐廳用餐與素食說明」裡的設定顯示。',sections:[
   {type:'read',title:'包裝上的欄位',items:[
    w("{原材料名|げんざいりょうめい}","Genzairyōmei","原料名稱（成分表）"),
    w("アレルギー{物質|ぶっしつ}","Arerugī busshitsu","過敏原（常列出蛋、乳、蝦、蟹）")
   ]},
   {type:'read',title:'成分',items:[
    w("{豚肉|ぶたにく}・ポーク","Butaniku / pōku","豬肉",'no'),
    w("{牛肉|ぎゅうにく}・ビーフ","Gyūniku / bīfu","牛肉",'no'),
    w("{鶏肉|とりにく}・チキン","Toriniku / chikin","雞肉",'no'),
    w("{魚介類|ぎょかいるい}","Gyokairui","魚和海鮮",'no'),
    w("えび・かに・いか・{貝|かい}","Ebi / kani / ika / kai","蝦、蟹、花枝、貝類",'no'),
    w("かつお{節|ぶし}・{削|けず}り{節|ぶし}","Katsuobushi / kezuribushi","柴魚、柴魚片",'no'),
    w("{煮干|にぼ}し","Niboshi","小魚乾",'no'),
    w("ポークエキス・チキンエキス・ビーフエキス","Pōku ekisu / chikin ekisu / bīfu ekisu","豬、雞、牛的萃取物（湯粉、醬料常見）",'no'),
    w("かつおエキス・{魚介|ぎょかい}エキス","Katsuo ekisu / gyokai ekisu","柴魚、海鮮萃取物",'no'),
    w("ゼラチン","Zerachin","明膠（動物來源）",'no'),
    w("ラード・{動物油脂|どうぶつゆし}","Rādo / dōbutsu yushi","豬油、動物油脂",'no'),
    w("{魚醤|ぎょしょう}・オイスターソース","Gyoshō / oisutā sōsu","魚露、蠔油",'no'),
    w("ベーコン・ハム・ソーセージ","Bēkon / hamu / sōsēji","培根、火腿、香腸",'no'),
    w("ツナ・しらす","Tsuna / shirasu","鮪魚、魩仔魚",'no'),
    w("{白|しろ}だし・めんつゆ","Shirodashi / mentsuyu","白高湯、麵露（通常含柴魚）",'no'),
    w("{和風|わふう}だし","Wafū dashi","和風高湯（通常含柴魚）",'no'),
    w("コンソメ","Konsome","法式清湯、高湯塊（通常含肉）",'no'),
    w("だし","Dashi","高湯（要看是用什麼熬的）",'ask'),
    w("エキス","Ekisu","萃取物（要看前面寫什麼）",'ask'),
    w("ブイヨン・スープ","Buiyon / sūpu","高湯、湯底",'ask'),
    w("{香味油|こうみゆ}","Kōmiyu","香味油（可能用豬油或雞油）",'ask'),
    w("{卵|たまご}・{卵白|らんぱく}・{卵黄|らんおう}","Tamago / ranpaku / ran'ō","蛋、蛋白、蛋黃",'egg'),
    w("{乳|にゅう}・{乳製品|にゅうせいひん}","Nyū / nyūseihin","乳、乳製品",'dairy'),
    w("チーズ・バター・{生|なま}クリーム","Chīzu / batā / nama kurīmu","起司、奶油、鮮奶油",'dairy'),
    w("{乳清|にゅうせい}・ホエイ","Nyūsei / hoei","乳清",'dairy'),
    w("{昆布|こんぶ}","Konbu","昆布",'ok'),
    w("{椎茸|しいたけ}","Shiitake","香菇",'ok'),
    w("{野菜|やさい}","Yasai","蔬菜",'ok'),
    w("{大豆|だいず}・{豆腐|とうふ}・{豆乳|とうにゅう}","Daizu / tōfu / tōnyū","黃豆、豆腐、豆漿",'ok'),
    w("ネギ・ニンニク・ニラ・{玉|たま}ねぎ","Negi / ninniku / nira / tamanegi","蔥、蒜、韭菜、洋蔥（五辛可以）",'ok'),
    w("{植物性|しょくぶつせい}","Shokubutsusei","植物性",'ok'),
    w("ヴィーガン・プラントベース","Vīgan / purantobēsu","純素、植物基底",'ok'),
    w("{精進料理|しょうじんりょうり}","Shōjin ryōri","精進料理（傳統寺院素食）",'ok')
   ]},
   {type:'say',items:[
    p("{温|あたた}めてください。","Atatamete kudasai.","請幫我加熱。"),
    p("スプーンをください。","Supūn o kudasai.","請給我湯匙。"),
    p("{袋|ふくろ}はいりません。","Fukuro wa irimasen.","不用袋子。")
   ]},
   {type:'hear',items:[
    p("{温|あたた}めますか？","Atatamemasu ka?","要加熱嗎？",[p("はい、お{願|ねが}いします。","Hai, onegai shimasu.","要，麻煩了。"),NO_THANKS]),
    p("お{箸|はし}はお{付|つ}けしますか？","Ohashi wa otsuke shimasu ka?","需要筷子嗎？",[YES_PLEASE,NO_THANKS]),
    BAG
   ]}
  ]},
  {id:'tickets',title:'買票',chip:'買票',mark:'券',reading:'けん',sections:[
   {type:'say',items:[
    p("{大人|おとな}{5枚|ごまい}お{願|ねが}いします。","Otona gomai onegai shimasu.","大人五張。"),
    p("{往復|おうふく}でお{願|ねが}いします。","Ōfuku de onegai shimasu.","要來回票。"),
    p("{赤|あか}ちゃんは{無料|むりょう}ですか？","Akachan wa muryō desu ka?","寶寶免費嗎？"),
    p("ベビーカーのまま{乗|の}れますか？","Bebīkā no mama noremasu ka?","推車可以直接推上去嗎？"),
    p("{次|つぎ}は{何時|なんじ}ですか？","Tsugi wa nanji desu ka?","下一班是幾點？"),
    p("{最終|さいしゅう}は{何時|なんじ}ですか？","Saishū wa nanji desu ka?","最後一班是幾點？"),
    p("コインロッカーはどこですか？","Koin rokkā wa doko desu ka?","投幣置物櫃在哪裡？"),
    p("{再入場|さいにゅうじょう}できますか？","Sainyūjō dekimasu ka?","可以再入場嗎？")
   ]},
   {type:'hear',items:[
    p("{往復|おうふく}ですか、{片道|かたみち}ですか？","Ōfuku desu ka, katamichi desu ka?","來回還是單程？",[p("{往復|おうふく}です。","Ōfuku desu.","來回。")]),
    p("ベビーカーはたたんでください。","Bebīkā wa tatande kudasai.","請把推車收起來。",[OK]),
    p("{次|つぎ}の{便|びん}をお{待|ま}ちください。","Tsugi no bin o omachi kudasai.","請等下一班。",[OK])
   ]}
  ]},
  {id:'shopping',title:'逛街購物與免稅',chip:'購物免稅',mark:'買',reading:'か',sections:[
   {type:'say',items:[
    p("これはいくらですか？","Kore wa ikura desu ka?","這個多少錢？"),
    p("これをください。","Kore o kudasai.","我要這個。"),
    p("{免税|めんぜい}できますか？","Menzei dekimasu ka?","可以免稅嗎？"),
    p("{別|べつ}のサイズはありますか？","Betsu no saizu wa arimasu ka?","有別的尺寸嗎？"),
    p("{試着|しちゃく}してもいいですか？","Shichaku shite mo ii desu ka?","可以試穿嗎？"),
    p("{見|み}ているだけです。","Mite iru dake desu.","我只是看看。"),
    p("プレゼント{用|よう}に{包|つつ}んでいただけますか？","Purezento-yō ni tsutsunde itadakemasu ka?","可以包裝成送禮用嗎？")
   ]},
   {type:'hear',items:[
    BAG,
    p("ポイントカードはお{持|も}ちですか？","Pointo kādo wa omochi desu ka?","有集點卡嗎？",[p("ありません。","Arimasen.","沒有。")]),
    p("お{支払|しはら}いはどうされますか？","Oshiharai wa dō saremasu ka?","要怎麼付款？",[p("カードで。","Kādo de.","刷卡。"),p("{現金|げんきん}で。","Genkin de.","付現。")]),
    p("お{支払|しはら}い{回数|かいすう}は？","Oshiharai kaisū wa?","要分幾期？（刷卡時）",[p("{一括|いっかつ}で。","Ikkatsu de.","一次付清。")]),
    p("パスポートをお{願|ねが}いします。","Pasupōto o onegai shimasu.","麻煩出示護照（辦免稅）。",[PLEASE])
   ]}
  ]},
  {id:'onsen',title:'泡湯',chip:'泡湯',mark:'湯',reading:'ゆ',tips:['進浴池前，先在洗身區把身體沖洗乾淨。','毛巾不要放進浴池裡。','寶寶能不能入浴、刺青規定，依各館規定，先問櫃台。'],sections:[
   {type:'read',title:'標示',items:[
    w("{男湯|おとこゆ}","Otoko-yu","男湯"),
    w("{女湯|おんなゆ}","Onna-yu","女湯"),
    w("{貸切風呂|かしきりぶろ}・{家族風呂|かぞくぶろ}","Kashikiri-buro / kazoku-buro","包租湯屋、家族湯"),
    w("{使用中|しようちゅう}","Shiyōchū","使用中"),
    w("{空|あ}き","Aki","空著，可以使用"),
    w("{脱衣所|だついじょ}","Datsuijo","更衣室")
   ]},
   {type:'say',items:[
    p("{貸切風呂|かしきりぶろ}は{予約|よやく}できますか？","Kashikiri-buro wa yoyaku dekimasu ka?","包租湯屋可以預約嗎？"),
    p("{2部屋|ふたへや}、{同|おな}じ{時間|じかん}に{使|つか}えますか？","Futaheya, onaji jikan ni tsukaemasu ka?","兩間可以在同一時段使用嗎？"),
    p("{何時|なんじ}から{何時|なんじ}まで{入|はい}れますか？","Nanji kara nanji made hairemasu ka?","幾點到幾點可以泡？"),
    p("{待|ま}ち{時間|じかん}はどのくらいですか？","Machi jikan wa dono kurai desu ka?","大概要等多久？"),
    p("{赤|あか}ちゃんも{入|はい}れますか？","Akachan mo hairemasu ka?","寶寶也可以泡嗎？"),
    p("タオルはありますか？","Taoru wa arimasu ka?","有毛巾嗎？")
   ]},
   {type:'hear',items:[
    p("ただいま{全室|ぜんしつ}{使用中|しようちゅう}です。","Tadaima zenshitsu shiyōchū desu.","現在全部使用中。",[p("{何分|なんぷん}くらい{待|ま}ちますか？","Nanpun kurai machimasu ka?","大概要等幾分鐘？")]),
    p("{時間|じかん}になったらお{呼|よ}びします。","Jikan ni nattara oyobi shimasu.","時間到了會叫您。",[OK])
   ]}
  ]},
  {id:'snow',title:'雪天路況',chip:'雪天路況',mark:'雪',reading:'ゆき',intro:'由布院若大雪或封路，改用小倉城版本。看到下面這些字，先停下來確認路況。',sections:[
   {type:'read',title:'道路資訊',items:[
    w("{通行止|つうこうど}め","Tsūkōdome","封路、禁止通行"),
    w("チェーン{規制|きせい}","Chēn kisei","必須裝雪鏈才能通行"),
    w("{冬用|ふゆよう}タイヤ{規制|きせい}","Fuyuyō taiya kisei","必須冬季輪胎才能通行"),
    w("{凍結|とうけつ}{注意|ちゅうい}","Tōketsu chūi","注意路面結冰"),
    w("{積雪|せきせつ}","Sekisetsu","積雪"),
    w("{規制|きせい}{解除|かいじょ}","Kisei kaijo","解除管制")
   ]},
   {type:'say',items:[
    p("{由布院|ゆふいん}までの{道|みち}は{通|とお}れますか？","Yufuin made no michi wa tooremasu ka?","到由布院的路可以通行嗎？"),
    p("{福岡|ふくおか}{方面|ほうめん}の{道|みち}は{通|とお}れますか？","Fukuoka hōmen no michi wa tooremasu ka?","往福岡方向的路可以通行嗎？"),
    p("チェーンは{必要|ひつよう}ですか？","Chēn wa hitsuyō desu ka?","需要裝雪鏈嗎？"),
    p("{雪|ゆき}のため、{到着|とうちゃく}が{遅|おく}れます。","Yuki no tame, tōchaku ga okuremasu.","因為下雪，會晚一點到。（打給住宿或餐廳）"),
    p("キャンセルできますか？","Kyanseru dekimasu ka?","可以取消嗎？")
   ]},
   {type:'hear',items:[
    p("{今日|きょう}は{通行止|つうこうど}めです。","Kyō wa tsūkōdome desu.","今天封路。",[p("わかりました。ありがとうございます。","Wakarimashita. Arigatō gozaimasu.","知道了，謝謝。")]),
    p("チェーンが{必要|ひつよう}です。","Chēn ga hitsuyō desu.","需要裝雪鏈。",[OK])
   ]}
  ]},
  {id:'gas',title:'加油',chip:'加油',mark:'油',reading:'あぶら',intro:'日本加油機的油槍：紅色是一般汽油（レギュラー），黃色是高級汽油（ハイオク），綠色是柴油（軽油）。租來的車要加哪一種，以租車公司說明為準。',sections:[
   {type:'read',title:'加油機',items:[
    w("レギュラー","Regyurā","一般汽油（紅色油槍）"),
    w("ハイオク","Haioku","高級汽油（黃色油槍）"),
    w("{軽油|けいゆ}","Keiyu","柴油（綠色油槍），不是汽油，別加錯"),
    w("{満|まん}タン","Mantan","加滿"),
    w("セルフ","Serufu","自助加油"),
    w("{静電気|せいでんき}{除去|じょきょ}シート","Seidenki jokyo shīto","靜電消除板（加油前先摸一下）"),
    w("{精算|せいさん}","Seisan","結帳")
   ]},
   {type:'say',items:[
    p("この{近|ちか}くにガソリンスタンドはありますか？","Kono chikaku ni gasorin sutando wa arimasu ka?","這附近有加油站嗎？"),
    p("レギュラー、{満|まん}タンでお{願|ねが}いします。","Regyurā, mantan de onegai shimasu.","一般汽油，加滿。"),
    CARD,
    p("レシートをください。","Reshīto o kudasai.","請給我收據。（還車時可能要看）")
   ]},
   {type:'hear',items:[
    p("{油種|ゆしゅ}は{何|なん}になさいますか？","Yushu wa nan ni nasaimasu ka?","要加哪一種油？",[p("レギュラーです。","Regyurā desu.","一般汽油。")]),
    p("{窓|まど}をお{拭|ふ}きしましょうか？","Mado o ofuki shimashō ka?","需要幫您擦車窗嗎？",[NO_THANKS,YES_PLEASE]),
    p("ゴミはございますか？","Gomi wa gozaimasu ka?","有垃圾要丟嗎？",[YES_PLEASE,p("ありません。","Arimasen.","沒有。")])
   ]}
  ]},
  {id:'airport',title:'機場報到與出境',chip:'機場報到',mark:'空',reading:'くう',sections:[
   {type:'say',items:[
    p("{台北|たいぺい}{行|い}きのカウンターはどこですか？","Taipei-iki no kauntā wa doko desu ka?","往台北的報到櫃台在哪裡？"),
    p("{荷物|にもつ}を{預|あず}けたいです。","Nimotsu o azuketai desu.","我要托運行李。"),
    p("{赤|あか}ちゃん{連|づ}れです。","Akachan-zure desu.","我們帶著寶寶。"),
    p("ベビーカーは{搭乗口|とうじょうぐち}まで{使|つか}えますか？","Bebīkā wa tōjōguchi made tsukaemasu ka?","推車可以用到登機口嗎？")
   ]},
   {type:'hear',items:[
    p("{搭乗券|とうじょうけん}とパスポートをお{願|ねが}いします。","Tōjōken to pasupōto o onegai shimasu.","請出示登機證和護照。",[PLEASE]),
    p("{預|あず}けるお{荷物|にもつ}はいくつですか？","Azukeru onimotsu wa ikutsu desu ka?","要托運幾件行李？",[p("○{個|こ}です。","○ ko desu.","○ 件。")]),
    p("モバイルバッテリーは{入|はい}っていますか？","Mobairu batterī wa haitte imasu ka?","裡面有行動電源嗎？",[p("{入|はい}っていません。","Haitte imasen.","沒有。")]),
    p("{液体|えきたい}は{出|だ}してください。","Ekitai wa dashite kudasai.","請把液體拿出來。",[p("{赤|あか}ちゃんのミルクです。","Akachan no miruku desu.","這是寶寶的奶。")])
   ]}
  ]},
  {id:'baby',title:'寶寶',chip:'寶寶',mark:'子',reading:'こ',always:true,sections:[
   {type:'say',items:[
    p("おむつ{交換台|こうかんだい}はどこですか？","Omutsu kōkandai wa doko desu ka?","尿布台在哪裡？"),
    p("{授乳室|じゅにゅうしつ}はありますか？","Junyūshitsu wa arimasu ka?","有哺乳室嗎？"),
    p("ミルク{用|よう}のお{湯|ゆ}をいただけますか？","Miruku-yō no oyu o itadakemasu ka?","可以給我泡奶用的熱水嗎？"),
    p("{離乳食|りにゅうしょく}を{温|あたた}めていただけますか？","Rinyūshoku o atatamete itadakemasu ka?","可以幫忙加熱寶寶的副食品嗎？"),
    p("{子|こ}ども{用|よう}の{食器|しょっき}はありますか？","Kodomo-yō no shokki wa arimasu ka?","有兒童餐具嗎？"),
    p("エレベーターはどこですか？","Erebētā wa doko desu ka?","電梯在哪裡？"),
    p("ベビーカーを{借|か}りられますか？","Bebīkā o kariraremasu ka?","可以借推車嗎？")
   ]},
   {type:'read',title:'標示',items:[
    w("{多目的|たもくてき}トイレ","Tamokuteki toire","多功能廁所（通常有尿布台）"),
    w("ベビールーム","Bebī rūmu","育嬰室")
   ]},
   {type:'hear',items:[
    p("お{子|こ}さんは{何歳|なんさい}ですか？","Okosan wa nansai desu ka?","小朋友幾歲？",[p("{1歳半|いっさいはん}です。","Issai-han desu.","一歲半。")]),
    p("かわいいですね。","Kawaii desu ne.","好可愛喔。",[p("ありがとうございます。","Arigatō gozaimasu.","謝謝。")])
   ]}
  ]},
  {id:'emergency',title:'身體不適與緊急',chip:'緊急',mark:'急',reading:'きゅう',always:true,sections:[
   {type:'read',title:'緊急電話',items:[
    w("119{番|ばん}","Hyaku-jū-kyū-ban","救護車、火災"),
    w("110{番|ばん}","Hyaku-tō-ban","警察")
   ]},
   {type:'say',items:[
    p("{救急車|きゅうきゅうしゃ}を{呼|よ}んでください。","Kyūkyūsha o yonde kudasai.","請叫救護車。"),
    p("{近|ちか}くに{病院|びょういん}はありますか？","Chikaku ni byōin wa arimasu ka?","附近有醫院嗎？"),
    p("{子|こ}どもが{熱|ねつ}を{出|だ}しました。","Kodomo ga netsu o dashimashita.","孩子發燒了。"),
    p("{気分|きぶん}が{悪|わる}いです。","Kibun ga warui desu.","身體不舒服。"),
    p("ここが{痛|いた}いです。","Koko ga itai desu.","這裡痛。"),
    p("{薬局|やっきょく}はどこですか？","Yakkyoku wa doko desu ka?","藥局在哪裡？"),
    p("{中国語|ちゅうごくご}か{英語|えいご}を{話|はな}せる{方|かた}はいますか？","Chūgokugo ka eigo o hanaseru kata wa imasu ka?","有會說中文或英文的人嗎？"),
    p("{事故|じこ}にあいました。","Jiko ni aimashita.","我們發生事故了。"),
    p("{警察|けいさつ}を{呼|よ}んでください。","Keisatsu o yonde kudasai.","請叫警察。")
   ]},
   {type:'hear',items:[
    p("どうしましたか？","Dō shimashita ka?","怎麼了？",[p("{気分|きぶん}が{悪|わる}いです。","Kibun ga warui desu.","身體不舒服。")]),
    p("{保険証|ほけんしょう}はありますか？","Hokenshō wa arimasu ka?","有健保卡嗎？",[p("{外国人|がいこくじん}{旅行者|りょこうしゃ}です。","Gaikokujin ryokōsha desu.","我們是外國旅客。")])
   ]}
  ]},
  {id:'basics',title:'基本招呼與廁所',chip:'基本會話',mark:'話',reading:'わ',always:true,sections:[
   {type:'say',items:[
    p("すみません。","Sumimasen.","不好意思／請問一下。"),
    p("ありがとうございます。","Arigatō gozaimasu.","謝謝。"),
    p("お{願|ねが}いします。","Onegai shimasu.","麻煩您了。"),
    p("{大丈夫|だいじょうぶ}です。","Daijōbu desu.","沒關係／不用了。"),
    p("トイレはどこですか？","Toire wa doko desu ka?","廁所在哪裡？"),
    p("もう{一度|いちど}お{願|ねが}いします。","Mō ichido onegai shimasu.","請再說一次。"),
    p("ゆっくり{話|はな}していただけますか？","Yukkuri hanashite itadakemasu ka?","可以說慢一點嗎？"),
    p("{日本語|にほんご}は{少|すこ}ししかわかりません。","Nihongo wa sukoshi shika wakarimasen.","我只懂一點點日文。"),
    p("{写真|しゃしん}を{撮|と}っていただけますか？","Shashin o totte itadakemasu ka?","可以幫我們拍照嗎？"),
    p("ここで{写真|しゃしん}を{撮|と}ってもいいですか？","Koko de shashin o totte mo ii desu ka?","這裡可以拍照嗎？")
   ]},
   {type:'read',title:'標示',items:[
    w("お{手洗|てあら}い・トイレ","Otearai / toire","廁所"),
    w("{男|おとこ}・{女|おんな}","Otoko / onna","男／女"),
    w("{撮影禁止|さつえいきんし}","Satsuei kinshi","禁止拍照"),
    w("{営業中|えいぎょうちゅう}・{準備中|じゅんびちゅう}","Eigyōchū / junbichū","營業中／準備中（還沒開）"),
    w("{定休日|ていきゅうび}","Teikyūbi","公休日")
   ]},
   {type:'hear',items:[
    p("いらっしゃいませ。","Irasshaimase.","歡迎光臨。（不用回答，點頭就好）"),
    p("{少々|しょうしょう}お{待|ま}ちください。","Shōshō omachi kudasai.","請稍等。")
   ]}
  ]}
 ];

 const data={version:'2026-11-26',diet,scenarios};
 if(typeof module==='object'&&module.exports)module.exports=data;
 root.JP_PHRASES=data;
})(typeof globalThis!=='undefined'?globalThis:this);
