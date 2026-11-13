var LANG = 'ar';
try { if (localStorage.getItem('card-lang') === 'en') LANG = 'en'; } catch (e) {}
if (LANG === 'en') { document.documentElement.lang = 'en'; document.documentElement.dir = 'ltr'; }
