// Shared header/footer + language system for GarbhaJyoti portal
(function () {
  var NAV = [
    ["index.html", "nav_home"],
    ["week.html", "nav_week"],
    ["names.html", "nav_names"],
    ["mantras.html", "nav_mantras"],
    ["about.html", "nav_about"],
  ];
  var page = (location.pathname.split("/").pop() || "index.html").split("?")[0];

  function buildChrome() {
    var T = window.I18N.t.bind(window.I18N);
    var navHtml = NAV.map(function (n) {
      var cls = n[0] === page ? ' class="active"' : "";
      return '<a href="' + n[0] + '"' + cls + " data-i18n=\"" + n[1] + "\">" + T(n[1]) + "</a>";
    }).join("");
    var header =
      '<header class="site-header"><div class="header-inner">' +
      '<a class="brand" href="index.html"><img src="assets/img/logo.png" alt="GarbhaJyoti">' +
      '<span class="brand-name">गर्भ ज्योति<small data-i18n="brand_sub">' + T("brand_sub") + "</small></span></a>" +
      '<div class="nav-wrap"><nav class="main-nav">' + navHtml + "</nav>" +
      '<div class="lang-toggle">' +
      '<button data-lang="hi">हिंदी</button><button data-lang="en">EN</button><button data-lang="ne">नेपाली</button>' +
      "</div></div></div></header>";
    var footer =
      '<footer class="site-footer"><div class="footer-inner">' +
      '<div><h4 data-i18n="f_about_t">' + T("f_about_t") + "</h4>" +
      '<p data-i18n="f_about_d">' + T("f_about_d") + "</p></div>" +
      '<div><h4 data-i18n="f_journey_t">' + T("f_journey_t") + "</h4><ul>" +
      '<li><a href="week.html" data-i18n="nav_week">' + T("nav_week") + "</a></li>" +
      '<li><a href="names.html" data-i18n="nav_names">' + T("nav_names") + "</a></li>" +
      '<li><a href="mantras.html" data-i18n="nav_mantras">' + T("nav_mantras") + "</a></li>" +
      '<li><a href="about.html" data-i18n="nav_about">' + T("nav_about") + "</a></li></ul></div>" +
      '<div><h4 data-i18n="f_connect_t">' + T("f_connect_t") + "</h4><ul>" +
      '<li><a href="https://www.youtube.com/@garbhajyoti" target="_blank" rel="noopener" data-i18n="f_yt">' + T("f_yt") + "</a></li>" +
      '<li data-i18n="f_newvid">' + T("f_newvid") + "</li></ul></div>" +
      "</div>" +
      '<div class="copyright" data-i18n="copyright">' + T("copyright") + "</div></footer>";
    document.body.insertAdjacentHTML("afterbegin", header);
    document.body.insertAdjacentHTML("beforeend", footer);
    document.querySelectorAll(".lang-toggle button").forEach(function (b) {
      b.addEventListener("click", function () {
        window.I18N.setLang(b.getAttribute("data-lang"));
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    buildChrome();
    window.I18N.apply();
  });
})();
