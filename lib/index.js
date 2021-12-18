var __create = Object.create;
var __defProp = Object.defineProperty;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __markAsModule = (target) => __defProp(target, "__esModule", {value: true});
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, {get: all[name], enumerable: true});
};
var __exportStar = (target, module2, desc) => {
  if (module2 && typeof module2 === "object" || typeof module2 === "function") {
    for (let key of __getOwnPropNames(module2))
      if (!__hasOwnProp.call(target, key) && key !== "default")
        __defProp(target, key, {get: () => module2[key], enumerable: !(desc = __getOwnPropDesc(module2, key)) || desc.enumerable});
  }
  return target;
};
var __toModule = (module2) => {
  return __exportStar(__markAsModule(__defProp(module2 != null ? __create(__getProtoOf(module2)) : {}, "default", module2 && module2.__esModule && "default" in module2 ? {get: () => module2.default, enumerable: true} : {value: module2, enumerable: true})), module2);
};

// src/index.ts
__markAsModule(exports);
__export(exports, {
  activate: () => activate
});
var import_fs = __toModule(require("fs"));
var import_coc2 = __toModule(require("coc.nvim"));

// src/lists.ts
var import_coc = __toModule(require("coc.nvim"));
var DemoList = class extends import_coc.BasicList {
  constructor(nvim) {
    super(nvim);
    this.name = "demo_list";
    this.description = "CocList for coc-tidal";
    this.defaultAction = "open";
    this.actions = [];
    this.addAction("open", (item) => {
      import_coc.window.showMessage(`${item.label}, ${item.data.name}`);
    });
  }
  async loadItems(context) {
    return [
      {
        label: "coc-tidal list item 1",
        data: {name: "list item 1"}
      },
      {
        label: "coc-tidal list item 2",
        data: {name: "list item 2"}
      }
    ];
  }
};
var lists_default = DemoList;

// src/index.ts
async function activate(context) {
  const enable = import_coc2.workspace.getConfiguration("tidal").get("enable");
  if (enable)
    return;
  const samples = getSamples();
  context.subscriptions.push(import_coc2.listManager.registerList(new lists_default(import_coc2.workspace.nvim)));
  context.subscriptions.push(import_coc2.sources.createSource({
    name: "coc-tidal completion source",
    doComplete: async () => {
      const items = await getCompletionItems(samples);
      return items;
    }
  }));
}
async function getCompletionItems(samples) {
  const items = samples.map((sample) => {
    return {
      word: sample,
      menu: "[Tidal - Samples]"
    };
  });
  return {
    items
  };
}
function getSamples() {
  const path = import_coc2.workspace.getConfiguration("tidal").get("samplePath");
  try {
    const samples = import_fs.default.readdirSync(path);
    return samples;
  } catch (err) {
    import_coc2.window.showErrorMessage("coc-tidal: Samples couldn\u2019t load");
    return [];
  }
}
