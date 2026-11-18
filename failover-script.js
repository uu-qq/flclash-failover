// FlClash 脚本模式专用：给配置自动加上「故障转移」策略组
// 逻辑：按节点名把节点分到 新加坡/日本/香港/美国 四个地区组（组内 url-test 自动选最快活节点），
// 再建一个 fallback 顶层组：按 新加坡→日本→香港→美国 的顺序用第一个活着的地区，
// 当前地区全超时就自动切下一个，恢复后切回。
// 某个地区一个节点都没有时自动跳过该组，不会报错；配置里没有内嵌节点时原样返回。
function main(config) {
  var TEST_URL = "http://www.gstatic.com/generate_204";
  var names = (config.proxies || []).map(function (p) { return p.name; });
  var regions = [
    ["新加坡自动", /新加坡|狮城|Singapore|\bSG\b|🇸🇬/i],
    ["日本自动", /日本|东京|大阪|Japan|Tokyo|Osaka|\bJP\b|🇯🇵/i],
    ["香港自动", /香港|Hong ?Kong|\bHK\b|🇭🇰/i],
    ["美国自动", /美国|洛杉矶|圣何塞|United ?States|America|\bUS\b|🇺🇸/i]
  ];
  var newGroups = [];
  var order = [];
  regions.forEach(function (r) {
    var members = names.filter(function (n) { return r[1].test(n); });
    if (members.length > 0) {
      newGroups.push({
        name: r[0],
        type: "url-test",
        proxies: members,
        url: TEST_URL,
        interval: 60,
        timeout: 5000,
        tolerance: 80,
        lazy: false
      });
      order.push(r[0]);
    }
  });
  if (order.length === 0) return config;
  newGroups.push({
    name: "故障转移",
    type: "fallback",
    proxies: order,
    url: TEST_URL,
    interval: 60,
    timeout: 5000,
    lazy: false
  });
  config["proxy-groups"] = newGroups.concat(config["proxy-groups"] || []);
  // 把「故障转移」插到第一个手动选择组的最前面，方便在代理页选用
  var groups = config["proxy-groups"];
  for (var i = 0; i < groups.length; i++) {
    var g = groups[i];
    if (g.type === "select" && newGroups.indexOf(g) === -1 && Array.isArray(g.proxies)) {
      if (g.proxies.indexOf("故障转移") === -1) g.proxies.unshift("故障转移");
      break;
    }
  }
  return config;
}
