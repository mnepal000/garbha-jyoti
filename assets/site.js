// Shared header/footer for GarbhaJyoti portal
(function () {
  var NAV = [
    ["index.html", "मुख्य"],
    ["week.html", "सप्ताह यात्रा"],
    ["names.html", "शिशु नाम"],
    ["mantras.html", "मंत्र"],
    ["about.html", "परिचय"],
  ];
  var page = (location.pathname.split("/").pop() || "index.html").split("?")[0];
  var navHtml = NAV.map(function (n) {
    var cls = n[0] === page ? ' class="active"' : "";
    return '<a href="' + n[0] + '"' + cls + ">" + n[1] + "</a>";
  }).join("");
  var header =
    '<header class="site-header"><div class="header-inner">' +
    '<a class="brand" href="index.html"><img src="assets/img/logo.png" alt="GarbhaJyoti">' +
    '<span class="brand-name">गर्भ ज्योति<small>GarbhaJyoti • Garbh Sanskar</small></span></a>' +
    '<nav class="main-nav">' + navHtml + "</nav></div></header>";
  var footer =
    '<footer class="site-footer"><div class="footer-inner">' +
    '<div><h4>गर्भ ज्योति</h4><p>सप्ताह-दर-सप्ताह गर्भावस्था ज्ञान: शिशु का विकास, मंत्र, प्रार्थनाएँ और प्राचीन कथाएँ।</p></div>' +
    '<div><h4>यात्रा</h4><ul><li><a href="week.html">सप्ताह-दर-सप्ताह</a></li>' +
    '<li><a href="names.html">शिशु नाम संग्रह</a></li><li><a href="mantras.html">मंत्र और प्रार्थना</a></li>' +
    '<li><a href="about.html">परिचय</a></li></ul></div>' +
    '<div><h4>जुड़ें</h4><ul><li><a href="https://www.youtube.com/@garbhajyoti" target="_blank" rel="noopener">YouTube चैनल</a></li>' +
    "<li>नए वीडियो हर सप्ताह</li></ul></div>" +
    "</div>" +
    '<div class="copyright">© 2026 गर्भ ज्योति (GarbhaJyoti) • परंपरा से मार्गदर्शित, AI की सहायता से निर्मित सामग्री</div></footer>';
  document.addEventListener("DOMContentLoaded", function () {
    document.body.insertAdjacentHTML("afterbegin", header);
    document.body.insertAdjacentHTML("beforeend", footer);
  });
})();
