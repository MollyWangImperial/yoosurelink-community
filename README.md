# yoosurelink

Static website for the yoosurelink community, built from the 社群网站原型 prototype.

- `index.html` holds every page; `app.js` switches between them by hash (`#home`, `#events`, `#bookclub`, `#plans`, ...).
- `#bookclub` is the 读书会 column: introduction, mentor profile, season syllabus, session format, pricing, payment channels, refund and invoice notes, FAQ.
- Text in square brackets, such as `[导师姓名]`, `[助教微信号]` or `[微信支付收款码]`, is a placeholder to replace with real details.
- The sign-up form has no backend: it creates an order number and shows payment instructions; the visitor sends the order number to the assistant on WeChat.

Deployed on Render as a static site from `render.yaml`.
