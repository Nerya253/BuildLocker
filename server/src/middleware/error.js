/* src/middleware/errorHandler.js */

/* ============================================================
   מנגנון טיפול בשגיאות מרכזי (Global Error Handler)
   ============================================================ */

/**
 * Middleware לטיפול בכל השגיאות במערכת.
 * מקבל שגיאות מכל ה-Services והנתיבים ומחזיר תגובה אחידה ללקוח.
 */
export function errorHandler(err, req, res, next) {
  // 1. הגנה מקריסה: אם הכותרות כבר נשלחו (למשל ב-Streaming), לא ניתן לשלוח תגובה חדשה
  if (res.headersSent) {
    return next(err);
  }

  // 2. קביעת קוד הסטטוס
  // בודקים status (מ-assert) או statusCode (מספריות חיצוניות)
  let status = Number(err.status || err.statusCode || 500);

  // הגנה מפני סטטוסים לא תקינים (חייב להיות בטווח שגיאות לקוח/שרת)
  if (isNaN(status) || status < 400 || status > 599) {
    status = 500;
  }

  // 3. קביעת הודעת השגיאה
  let message = err.message || 'Internal Server Error';

  // טיפול מיוחד בשגיאות תחביר ב-JSON (למשל Body לא תקין שנשלח מהלקוח)
  if (err instanceof SyntaxError && status === 400 && 'body' in err) {
    message = 'Invalid JSON payload';
  }

  // 4. אבטחה וניהול סביבות (Production vs Development)
  const isProd = process.env.NODE_ENV === 'production';

  if (isProd && status >= 500) {
    // בייצור: מתעדים את השגיאה המלאה ללוג הפנימי אך מחזירים הודעה כללית למניעת חשיפת מידע
    console.error(`🔥 [CRITICAL ERROR] ${req.method} ${req.url}:`, err);
    message = 'Internal Server Error';
  } else if (!isProd) {
    // בפיתוח: מדפיסים את השגיאה המלאה לקונסול עם ה-Stack Trace לנוחות הדיבאגינג
    console.error(`🔥 [ERROR] ${status} - ${message}`);
    if (err.stack) {
      console.error(err.stack);
    }
  }

  // 5. החזרת התגובה ללקוח בפורמט אחיד של הפרויקט
  return res.status(status).json({
    ok: false,
    error: message,
    // הוספת ה-Stack Trace ל-JSON רק בסביבת פיתוח עבור שגיאות שרת
    stack: !isProd && status >= 500 ? err.stack : undefined,
  });
}
