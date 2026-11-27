/** preset-data-bridge.js 【新建文件】
 * 对应原作者 default‑cards‑data.js，存放原始系统预设字卡JSON
 * 只读，不写localStorage；真实全量字卡内容粘贴进DEFAULT_CARD_DATA对象
*/
export const DEFAULT_CARD_DATA = {
  "main":[
    ["生活碎片",["刚刚整理了一下东西","今天收拾了一下房间"]]
    // >>>这里粘贴完整原作者main、kaomoji、emoji、touch、dict、fish、garden等全部分组数据
  ],
  "kaomoji":[],
  "emoji":[],
  "touch":[],
  "dict":[],
  "fish":[],
  "garden":[],
  "sync":[],
  "reach":[],
  "water":[],
  "piggy":[],
  "eat":[],
  "period":[],
  "room":[],
  "cjian":[],
  "drift":[],
  "music":[]
};

export function getRawPresetSource(){
  return JSON.parse(JSON.stringify(DEFAULT_CARD_DATA));
}
