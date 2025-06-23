"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "pages/api/notifications/send";
exports.ids = ["pages/api/notifications/send"];
exports.modules = {

/***/ "(api-node)/./lib/push-sender.js":
/*!****************************!*\
  !*** ./lib/push-sender.js ***!
  \****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   sendPushToToken: () => (/* binding */ sendPushToToken)\n/* harmony export */ });\n/* harmony import */ var firebase_admin__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! firebase-admin */ \"firebase-admin\");\n/* harmony import */ var firebase_admin__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(firebase_admin__WEBPACK_IMPORTED_MODULE_0__);\n\nconst serviceAccount = JSON.parse(Buffer.from(process.env.FCM_SERVICE_ACCOUNT_JSON, 'base64').toString('utf-8'));\nif (!(firebase_admin__WEBPACK_IMPORTED_MODULE_0___default().apps).length) {\n    firebase_admin__WEBPACK_IMPORTED_MODULE_0___default().initializeApp({\n        credential: firebase_admin__WEBPACK_IMPORTED_MODULE_0___default().credential.cert(serviceAccount)\n    });\n}\nasync function sendPushToToken(token, title, body, data = {}) {\n    const message = {\n        token,\n        notification: {\n            title,\n            body\n        },\n        data\n    };\n    try {\n        const response = await firebase_admin__WEBPACK_IMPORTED_MODULE_0___default().messaging().send(message);\n        return response;\n    } catch (err) {\n        throw new Error(`FCM error: ${err.message}`);\n    }\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKGFwaS1ub2RlKS8uL2xpYi9wdXNoLXNlbmRlci5qcyIsIm1hcHBpbmdzIjoiOzs7Ozs7QUFBbUM7QUFFbkMsTUFBTUMsaUJBQWlCQyxLQUFLQyxLQUFLLENBQy9CQyxPQUFPQyxJQUFJLENBQUNDLFFBQVFDLEdBQUcsQ0FBQ0Msd0JBQXdCLEVBQUUsVUFBVUMsUUFBUSxDQUFDO0FBR3ZFLElBQUksQ0FBQ1QsNERBQVUsQ0FBQ1csTUFBTSxFQUFFO0lBQ3RCWCxtRUFBbUIsQ0FBQztRQUNsQmEsWUFBWWIsZ0VBQWdCLENBQUNjLElBQUksQ0FBQ2I7SUFDcEM7QUFDRjtBQUVPLGVBQWVjLGdCQUFnQkMsS0FBSyxFQUFFQyxLQUFLLEVBQUVDLElBQUksRUFBRUMsT0FBTyxDQUFDLENBQUM7SUFDakUsTUFBTUMsVUFBVTtRQUNkSjtRQUNBSyxjQUFjO1lBQUVKO1lBQU9DO1FBQUs7UUFDNUJDO0lBQ0Y7SUFFQSxJQUFJO1FBQ0YsTUFBTUcsV0FBVyxNQUFNdEIsK0RBQWUsR0FBR3dCLElBQUksQ0FBQ0o7UUFDOUMsT0FBT0U7SUFDVCxFQUFFLE9BQU9HLEtBQUs7UUFDWixNQUFNLElBQUlDLE1BQU0sQ0FBQyxXQUFXLEVBQUVELElBQUlMLE9BQU8sRUFBRTtJQUM3QztBQUNGIiwic291cmNlcyI6WyJDOlxcVXNlcnNcXGRvbWVuXFxEZXNrdG9wXFxFTEVNRU5USVxcemFkbmppcHJvamVrdCDigJMgVjMuMiAxMS42LjIwMjUgREVMVUpPxIxBXFxsaWJcXHB1c2gtc2VuZGVyLmpzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBhZG1pbiBmcm9tICdmaXJlYmFzZS1hZG1pbic7XHJcblxyXG5jb25zdCBzZXJ2aWNlQWNjb3VudCA9IEpTT04ucGFyc2UoXHJcbiAgQnVmZmVyLmZyb20ocHJvY2Vzcy5lbnYuRkNNX1NFUlZJQ0VfQUNDT1VOVF9KU09OLCAnYmFzZTY0JykudG9TdHJpbmcoJ3V0Zi04JylcclxuKTtcclxuXHJcbmlmICghYWRtaW4uYXBwcy5sZW5ndGgpIHtcclxuICBhZG1pbi5pbml0aWFsaXplQXBwKHtcclxuICAgIGNyZWRlbnRpYWw6IGFkbWluLmNyZWRlbnRpYWwuY2VydChzZXJ2aWNlQWNjb3VudCksXHJcbiAgfSk7XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzZW5kUHVzaFRvVG9rZW4odG9rZW4sIHRpdGxlLCBib2R5LCBkYXRhID0ge30pIHtcclxuICBjb25zdCBtZXNzYWdlID0ge1xyXG4gICAgdG9rZW4sXHJcbiAgICBub3RpZmljYXRpb246IHsgdGl0bGUsIGJvZHkgfSxcclxuICAgIGRhdGEsXHJcbiAgfTtcclxuXHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgYWRtaW4ubWVzc2FnaW5nKCkuc2VuZChtZXNzYWdlKTtcclxuICAgIHJldHVybiByZXNwb25zZTtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIHRocm93IG5ldyBFcnJvcihgRkNNIGVycm9yOiAke2Vyci5tZXNzYWdlfWApO1xyXG4gIH1cclxufSJdLCJuYW1lcyI6WyJhZG1pbiIsInNlcnZpY2VBY2NvdW50IiwiSlNPTiIsInBhcnNlIiwiQnVmZmVyIiwiZnJvbSIsInByb2Nlc3MiLCJlbnYiLCJGQ01fU0VSVklDRV9BQ0NPVU5UX0pTT04iLCJ0b1N0cmluZyIsImFwcHMiLCJsZW5ndGgiLCJpbml0aWFsaXplQXBwIiwiY3JlZGVudGlhbCIsImNlcnQiLCJzZW5kUHVzaFRvVG9rZW4iLCJ0b2tlbiIsInRpdGxlIiwiYm9keSIsImRhdGEiLCJtZXNzYWdlIiwibm90aWZpY2F0aW9uIiwicmVzcG9uc2UiLCJtZXNzYWdpbmciLCJzZW5kIiwiZXJyIiwiRXJyb3IiXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(api-node)/./lib/push-sender.js\n");

/***/ }),

/***/ "(api-node)/./node_modules/next/dist/build/webpack/loaders/next-route-loader/index.js?kind=PAGES_API&page=%2Fapi%2Fnotifications%2Fsend&preferredRegion=&absolutePagePath=.%2Fpages%5Capi%5Cnotifications%5Csend.js&middlewareConfigBase64=e30%3D!":
/*!**********************************************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-route-loader/index.js?kind=PAGES_API&page=%2Fapi%2Fnotifications%2Fsend&preferredRegion=&absolutePagePath=.%2Fpages%5Capi%5Cnotifications%5Csend.js&middlewareConfigBase64=e30%3D! ***!
  \**********************************************************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   config: () => (/* binding */ config),\n/* harmony export */   \"default\": () => (__WEBPACK_DEFAULT_EXPORT__),\n/* harmony export */   routeModule: () => (/* binding */ routeModule)\n/* harmony export */ });\n/* harmony import */ var next_dist_server_route_modules_pages_api_module_compiled__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/dist/server/route-modules/pages-api/module.compiled */ \"(api-node)/./node_modules/next/dist/server/route-modules/pages-api/module.compiled.js\");\n/* harmony import */ var next_dist_server_route_modules_pages_api_module_compiled__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_route_modules_pages_api_module_compiled__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var next_dist_server_route_kind__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next/dist/server/route-kind */ \"(api-node)/./node_modules/next/dist/server/route-kind.js\");\n/* harmony import */ var next_dist_build_templates_helpers__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next/dist/build/templates/helpers */ \"(api-node)/./node_modules/next/dist/build/templates/helpers.js\");\n/* harmony import */ var _pages_api_notifications_send_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./pages\\api\\notifications\\send.js */ \"(api-node)/./pages/api/notifications/send.js\");\n\n\n\n// Import the userland code.\n\n// Re-export the handler (should be the default export).\n/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ((0,next_dist_build_templates_helpers__WEBPACK_IMPORTED_MODULE_2__.hoist)(_pages_api_notifications_send_js__WEBPACK_IMPORTED_MODULE_3__, 'default'));\n// Re-export config.\nconst config = (0,next_dist_build_templates_helpers__WEBPACK_IMPORTED_MODULE_2__.hoist)(_pages_api_notifications_send_js__WEBPACK_IMPORTED_MODULE_3__, 'config');\n// Create and export the route module that will be consumed.\nconst routeModule = new next_dist_server_route_modules_pages_api_module_compiled__WEBPACK_IMPORTED_MODULE_0__.PagesAPIRouteModule({\n    definition: {\n        kind: next_dist_server_route_kind__WEBPACK_IMPORTED_MODULE_1__.RouteKind.PAGES_API,\n        page: \"/api/notifications/send\",\n        pathname: \"/api/notifications/send\",\n        // The following aren't used in production.\n        bundlePath: '',\n        filename: ''\n    },\n    userland: _pages_api_notifications_send_js__WEBPACK_IMPORTED_MODULE_3__\n});\n\n//# sourceMappingURL=pages-api.js.map//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKGFwaS1ub2RlKS8uL25vZGVfbW9kdWxlcy9uZXh0L2Rpc3QvYnVpbGQvd2VicGFjay9sb2FkZXJzL25leHQtcm91dGUtbG9hZGVyL2luZGV4LmpzP2tpbmQ9UEFHRVNfQVBJJnBhZ2U9JTJGYXBpJTJGbm90aWZpY2F0aW9ucyUyRnNlbmQmcHJlZmVycmVkUmVnaW9uPSZhYnNvbHV0ZVBhZ2VQYXRoPS4lMkZwYWdlcyU1Q2FwaSU1Q25vdGlmaWNhdGlvbnMlNUNzZW5kLmpzJm1pZGRsZXdhcmVDb25maWdCYXNlNjQ9ZTMwJTNEISIsIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQUErRjtBQUN2QztBQUNFO0FBQzFEO0FBQ2lFO0FBQ2pFO0FBQ0EsaUVBQWUsd0VBQUssQ0FBQyw2REFBUSxZQUFZLEVBQUM7QUFDMUM7QUFDTyxlQUFlLHdFQUFLLENBQUMsNkRBQVE7QUFDcEM7QUFDTyx3QkFBd0IseUdBQW1CO0FBQ2xEO0FBQ0EsY0FBYyxrRUFBUztBQUN2QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMLFlBQVk7QUFDWixDQUFDOztBQUVEIiwic291cmNlcyI6WyIiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgUGFnZXNBUElSb3V0ZU1vZHVsZSB9IGZyb20gXCJuZXh0L2Rpc3Qvc2VydmVyL3JvdXRlLW1vZHVsZXMvcGFnZXMtYXBpL21vZHVsZS5jb21waWxlZFwiO1xuaW1wb3J0IHsgUm91dGVLaW5kIH0gZnJvbSBcIm5leHQvZGlzdC9zZXJ2ZXIvcm91dGUta2luZFwiO1xuaW1wb3J0IHsgaG9pc3QgfSBmcm9tIFwibmV4dC9kaXN0L2J1aWxkL3RlbXBsYXRlcy9oZWxwZXJzXCI7XG4vLyBJbXBvcnQgdGhlIHVzZXJsYW5kIGNvZGUuXG5pbXBvcnQgKiBhcyB1c2VybGFuZCBmcm9tIFwiLi9wYWdlc1xcXFxhcGlcXFxcbm90aWZpY2F0aW9uc1xcXFxzZW5kLmpzXCI7XG4vLyBSZS1leHBvcnQgdGhlIGhhbmRsZXIgKHNob3VsZCBiZSB0aGUgZGVmYXVsdCBleHBvcnQpLlxuZXhwb3J0IGRlZmF1bHQgaG9pc3QodXNlcmxhbmQsICdkZWZhdWx0Jyk7XG4vLyBSZS1leHBvcnQgY29uZmlnLlxuZXhwb3J0IGNvbnN0IGNvbmZpZyA9IGhvaXN0KHVzZXJsYW5kLCAnY29uZmlnJyk7XG4vLyBDcmVhdGUgYW5kIGV4cG9ydCB0aGUgcm91dGUgbW9kdWxlIHRoYXQgd2lsbCBiZSBjb25zdW1lZC5cbmV4cG9ydCBjb25zdCByb3V0ZU1vZHVsZSA9IG5ldyBQYWdlc0FQSVJvdXRlTW9kdWxlKHtcbiAgICBkZWZpbml0aW9uOiB7XG4gICAgICAgIGtpbmQ6IFJvdXRlS2luZC5QQUdFU19BUEksXG4gICAgICAgIHBhZ2U6IFwiL2FwaS9ub3RpZmljYXRpb25zL3NlbmRcIixcbiAgICAgICAgcGF0aG5hbWU6IFwiL2FwaS9ub3RpZmljYXRpb25zL3NlbmRcIixcbiAgICAgICAgLy8gVGhlIGZvbGxvd2luZyBhcmVuJ3QgdXNlZCBpbiBwcm9kdWN0aW9uLlxuICAgICAgICBidW5kbGVQYXRoOiAnJyxcbiAgICAgICAgZmlsZW5hbWU6ICcnXG4gICAgfSxcbiAgICB1c2VybGFuZFxufSk7XG5cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXBhZ2VzLWFwaS5qcy5tYXAiXSwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(api-node)/./node_modules/next/dist/build/webpack/loaders/next-route-loader/index.js?kind=PAGES_API&page=%2Fapi%2Fnotifications%2Fsend&preferredRegion=&absolutePagePath=.%2Fpages%5Capi%5Cnotifications%5Csend.js&middlewareConfigBase64=e30%3D!\n");

/***/ }),

/***/ "(api-node)/./pages/api/notifications/send.js":
/*!*****************************************!*\
  !*** ./pages/api/notifications/send.js ***!
  \*****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (/* binding */ handler)\n/* harmony export */ });\n/* harmony import */ var _lib_push_sender__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../../lib/push-sender */ \"(api-node)/./lib/push-sender.js\");\n\nasync function handler(req, res) {\n    const { token } = req.body;\n    if (!token) return res.status(400).json({\n        error: 'Manjka token'\n    });\n    try {\n        await (0,_lib_push_sender__WEBPACK_IMPORTED_MODULE_0__.sendPushToToken)(token, 'Testno obvestilo', 'Push test uspešen 🚀');\n        res.status(200).json({\n            success: true\n        });\n    } catch (err) {\n        res.status(500).json({\n            error: err.message\n        });\n    }\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKGFwaS1ub2RlKS8uL3BhZ2VzL2FwaS9ub3RpZmljYXRpb25zL3NlbmQuanMiLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBMkQ7QUFFNUMsZUFBZUMsUUFBUUMsR0FBRyxFQUFFQyxHQUFHO0lBQzVDLE1BQU0sRUFBRUMsS0FBSyxFQUFFLEdBQUdGLElBQUlHLElBQUk7SUFDMUIsSUFBSSxDQUFDRCxPQUFPLE9BQU9ELElBQUlHLE1BQU0sQ0FBQyxLQUFLQyxJQUFJLENBQUM7UUFBRUMsT0FBTztJQUFlO0lBRWhFLElBQUk7UUFDRixNQUFNUixpRUFBZUEsQ0FBQ0ksT0FBTyxvQkFBb0I7UUFDakRELElBQUlHLE1BQU0sQ0FBQyxLQUFLQyxJQUFJLENBQUM7WUFBRUUsU0FBUztRQUFLO0lBQ3ZDLEVBQUUsT0FBT0MsS0FBSztRQUNaUCxJQUFJRyxNQUFNLENBQUMsS0FBS0MsSUFBSSxDQUFDO1lBQUVDLE9BQU9FLElBQUlDLE9BQU87UUFBQztJQUM1QztBQUNGIiwic291cmNlcyI6WyJDOlxcVXNlcnNcXGRvbWVuXFxEZXNrdG9wXFxFTEVNRU5USVxcemFkbmppcHJvamVrdCDigJMgVjMuMiAxMS42LjIwMjUgREVMVUpPxIxBXFxwYWdlc1xcYXBpXFxub3RpZmljYXRpb25zXFxzZW5kLmpzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHNlbmRQdXNoVG9Ub2tlbiB9IGZyb20gJy4uLy4uLy4uL2xpYi9wdXNoLXNlbmRlcic7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBhc3luYyBmdW5jdGlvbiBoYW5kbGVyKHJlcSwgcmVzKSB7XHJcbiAgY29uc3QgeyB0b2tlbiB9ID0gcmVxLmJvZHk7XHJcbiAgaWYgKCF0b2tlbikgcmV0dXJuIHJlcy5zdGF0dXMoNDAwKS5qc29uKHsgZXJyb3I6ICdNYW5qa2EgdG9rZW4nIH0pO1xyXG5cclxuICB0cnkge1xyXG4gICAgYXdhaXQgc2VuZFB1c2hUb1Rva2VuKHRva2VuLCAnVGVzdG5vIG9idmVzdGlsbycsICdQdXNoIHRlc3QgdXNwZcWhZW4g8J+agCcpO1xyXG4gICAgcmVzLnN0YXR1cygyMDApLmpzb24oeyBzdWNjZXNzOiB0cnVlIH0pO1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgcmVzLnN0YXR1cyg1MDApLmpzb24oeyBlcnJvcjogZXJyLm1lc3NhZ2UgfSk7XHJcbiAgfVxyXG59Il0sIm5hbWVzIjpbInNlbmRQdXNoVG9Ub2tlbiIsImhhbmRsZXIiLCJyZXEiLCJyZXMiLCJ0b2tlbiIsImJvZHkiLCJzdGF0dXMiLCJqc29uIiwiZXJyb3IiLCJzdWNjZXNzIiwiZXJyIiwibWVzc2FnZSJdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(api-node)/./pages/api/notifications/send.js\n");

/***/ }),

/***/ "firebase-admin":
/*!*********************************!*\
  !*** external "firebase-admin" ***!
  \*********************************/
/***/ ((module) => {

module.exports = require("firebase-admin");

/***/ }),

/***/ "next/dist/compiled/next-server/pages-api.runtime.dev.js":
/*!**************************************************************************!*\
  !*** external "next/dist/compiled/next-server/pages-api.runtime.dev.js" ***!
  \**************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/compiled/next-server/pages-api.runtime.dev.js");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../../webpack-api-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/next"], () => (__webpack_exec__("(api-node)/./node_modules/next/dist/build/webpack/loaders/next-route-loader/index.js?kind=PAGES_API&page=%2Fapi%2Fnotifications%2Fsend&preferredRegion=&absolutePagePath=.%2Fpages%5Capi%5Cnotifications%5Csend.js&middlewareConfigBase64=e30%3D!")));
module.exports = __webpack_exports__;

})();