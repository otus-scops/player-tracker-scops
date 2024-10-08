# Player Tracker (otusscops)変更版(player-tracker-ja-scops)

## はじめに
これは、[IITC-ja: Ingress Intel Total Conversion 日本語化版](https://ingress.love/iitc-ja/)を元に[NightHackzさん](https://github.com/NightHackzz/player-tracker-nhz)が以下の修正を加えたプラグインをもとに <br> 
- AGのトレース破線色をRES/ENLで色分け
- AGの追跡時間を3,6,12,24時間と指定可能にした
- AGの履歴詳細画面の履歴数を指定可能にした

さらに、以下の機能をotusscopsが追加実装したものです
- 指定AGのログを直近10分以内に確認した場合、アラートを表示する
- NIASection14を専用レイヤーに切り分け
- 追跡表示しないエージェントを指定可能
- （__MACHINA__を表示しないよう変更）←公式版で実装されたため、機能をマージし、実装を変更
- 追跡時間に15分、30分、1時間を追加
- 表示履歴数に2,3を追加

## ToDo
- 脱JQuery化
- 指定AGアイコンをまともに
- AGの行動履歴ポップアップから要注意指定の追加、削除
- AGごとのアイコン変更
- アラート表示時間を指定可能に？

## インストール
[Plugin Download](https://github.com/otus-scops/player-tracker-scops/raw/master/iitc-plugin-player-activity-tracker-scops.user.js) <br>

- あらかじめ、標準の「Player tracker」はOFFに設定してください。<br>
![設定画面](fig1-selection.png)<br>
- 上記「Plugin Download」リンクを選択し、開いた画面で「インストール」ボタンを押してください。<br>



## 注意事項
~~原則、新規機能追加や、既存機能の拡張はしません。~~<br>
不具合のある機能の修正、使えなくなってしまった機能の削除は行う可能性があります。<br>
本スクリプトの利用にかかわる一切の責任は利用者にあり、翻訳者および製作者・配布元が責任を負うことはありません。<br>

## ライセンス
本スクリプトのライセンスは、[ISC Licence](https://www.isc.org/downloads/software-support-policy/isc-license/)とさせて頂きます。

## 設定画面
「Player足跡」のメニューがツールボックスに追加されますので、それを選択して下さい。<br>
この画面が表示されますので、選択して「OK」ボタンを押して下さい。<br>
通知許可がない場合にのみ、「通知許可」ボタンが表示されます。<br>
通知が許可されていない場合はalert windowにて通知を行います。<br>


![オプション](fig2-dialog.png)
