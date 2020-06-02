!(function () {
  function r(o) {
    return (r =
      "function" == typeof Symbol && "symbol" == typeof Symbol.iterator
        ? function (o) {
            return typeof o;
          }
        : function (o) {
            return o &&
              "function" == typeof Symbol &&
              o.constructor === Symbol &&
              o !== Symbol.prototype
              ? "symbol"
              : typeof o;
          })(o);
  }
  !(function (o, e) {
    void 0 === e && (e = {});
    let t = e.insertAt;
    if (o && "undefined" != typeof document) {
      let n = document.head || document.getElementsByTagName("head")[0],
        c = document.createElement("style");
      (c.type = "text/css"),
        "top" === t && n.firstChild
          ? n.insertBefore(c, n.firstChild)
          : n.appendChild(c),
        c.styleSheet
          ? (c.styleSheet.cssText = o)
          : c.appendChild(document.createTextNode(o));
    }
  })(
    ".docsify-copy-code-button,.docsify-copy-code-button span{cursor:pointer;transition:all .25s ease}.docsify-copy-code-button{position:absolute;z-index:1;top:0;right:0;overflow:visible;padding:.65em .8em;border:0;border-radius:0;outline:0;font-size:1em;background:grey;background:let(--theme-color,grey);color:#fff;opacity:0}.docsify-copy-code-button span{border-radius:3px;background:inherit;pointer-events:none}.docsify-copy-code-button .error,.docsify-copy-code-button .success{position:absolute;z-index:-100;top:50%;left:0;padding:.5em .65em;font-size:.825em;opacity:0;-webkit-transform:translateY(-50%);transform:translateY(-50%)}.docsify-copy-code-button.error .error,.docsify-copy-code-button.success .success{opacity:1;-webkit-transform:translate(-115%,-50%);transform:translate(-115%,-50%)}.docsify-copy-code-button:focus,pre:hover .docsify-copy-code-button{opacity:1}"
  ),
    document.querySelector('link[href*="docsify-copy-code"]') &&
      console.warn(
        "[Deprecation] Link to external docsify-copy-code stylesheet is no longer necessary."
      ),
    (window.DocsifyCopyCodePlugin = {
      init: function () {
        return function (o, e) {
          o.ready(function () {
            console.warn(
              "[Deprecation] Manually initializing docsify-copy-code using window.DocsifyCopyCodePlugin.init() is no longer necessary."
            );
          });
        };
      },
    }),
    (window.$docsify = window.$docsify || {}),
    (window.$docsify.plugins = [
      function (o, s) {
        o.doneEach(function () {
          let o = Array.apply(
              null,
              document.querySelectorAll("pre[data-lang]")
            ),
            c = {
              buttonText: "Copy to clipboard",
              errorText: "Error",
              successText: "Copied",
            };
          s.config.copyCode &&
            Object.keys(c).forEach(function (t) {
              let n = s.config.copyCode[t];
              "string" == typeof n
                ? (c[t] = n)
                : "object" === r(n) &&
                  Object.keys(n).some(function (o) {
                    let e = -1 < location.href.indexOf(o);
                    return (c[t] = e ? n[o] : c[t]), e;
                  });
            });
          let e = [
            '<button class="docsify-copy-code-button">',
            '<span class="label mdi mdi-content-copy"></span>',
            '<span class="error">'.concat(c.errorText, "</span>"),
            '<span class="success">Copied</span>',
            "</button>",
          ].join("");
          o.forEach(function (o) {
            o.insertAdjacentHTML("beforeend", e);
          });
        }),
          o.mounted(function () {
            document
              .querySelector(".content")
              .addEventListener("click", function (o) {
                if (o.target.classList.contains("docsify-copy-code-button")) {
                  let e =
                      "BUTTON" === o.target.tagName
                        ? o.target
                        : o.target.parentNode,
                    t = document.createRange(),
                    n = e.parentNode.querySelector("code"),
                    c = window.getSelection();
                  t.selectNode(n), c.removeAllRanges(), c.addRange(t);
                  try {
                    document.execCommand("copy") &&
                      (e.classList.add("success"),
                      setTimeout(function () {
                        e.classList.remove("success");
                      }, 1e3));
                  } catch (o) {
                    console.error("docsify-copy-code: ".concat(o)),
                      e.classList.add("error"),
                      setTimeout(function () {
                        e.classList.remove("error");
                      }, 1e3);
                  }
                  "function" == typeof (c = window.getSelection()).removeRange
                    ? c.removeRange(t)
                    : "function" == typeof c.removeAllRanges &&
                      c.removeAllRanges();
                }
              });
          });
      },
    ].concat(window.$docsify.plugins || []));
})();
