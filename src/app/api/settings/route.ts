import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, unauthorized } from '@/lib/api-utils';
import { run, get } from '@/db';

// Ukrainian error messages
const ERROR_MESSAGES = {
  notAuthenticated: 'Необхідна авторизація',
  updateFailed: 'Не вдалося оновити налаштування',
  invalidField: 'Невірне значення поля',
};

// GET /api/settings - Get user settings
export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  
  if (!user) {
    return unauthorized();
  }
  
  try {
    // Get user settings from database
    const settings = await get(
      `SELECT 
        u.name as displayName,
        u.email,
        up.phone,
        up.language,
        up.timezone,
        up.date_format as dateFormat,
        up.currency,
        up.email_notifications as emailNotifications,
        up.push_notifications as pushNotifications,
        up.lesson_reminders as lessonReminders,
        up.payment_alerts as paymentAlerts,
        up.weekly_report as weeklyReport
      FROM users u
      LEFT JOIN user_settings up ON u.id = up.user_id
      WHERE u.id = ?`,
      [user.id]
    );
    
    // If no settings exist, return defaults
    if (!settings) {
      return NextResponse.json({
        settings: {
          displayName: user.name,
          email: user.email,
          phone: '',
          language: 'uk',
          timezone: 'Europe/Kyiv',
          dateFormat: 'DD.MM.YYYY',
          currency: 'UAH',
          emailNotifications: true,
          pushNotifications: true,
          lessonReminders: true,
          paymentAlerts: true,
          weeklyReport: true,
        },
      });
    }
    
    return NextResponse.json({
      settings: {
        displayName: settings.displayName || user.name,
        email: settings.email || user.email,
        phone: settings.phone || '',
        language: settings.language || 'uk',
        timezone: settings.timezone || 'Europe/Kyiv',
        dateFormat: settings.dateFormat || 'DD.MM.YYYY',
        currency: settings.currency || 'UAH',
        emailNotifications: settings.emailNotifications === 1,
        pushNotifications: settings.pushNotifications === 1,
        lessonReminders: settings.lessonReminders === 1,
        paymentAlerts: settings.paymentAlerts === 1,
        weeklyReport: settings.weeklyReport === 1,
      },
    });
  } catch (error) {
    console.error('Get settings error:', error);
    return NextResponse.json(
      { error: ERROR_MESSAGES.updateFailed },
      { status: 500 }
    );
  }
}

// PUT /api/settings - Update user settings
export async function PUT(request: NextRequest) {
  const user = await getAuthUser(request);
  
  if (!user) {
    return unauthorized();
  }
  
  try {
    const body = await request.json();
    const {
      displayName,
      email,
      phone,
      language,
      timezone,
      dateFormat,
      currency,
      emailNotifications,
      pushNotifications,
      lessonReminders,
      paymentAlerts,
      weeklyReport,
    } = body;
    
    // Update user name
    if (displayName !== undefined) {
      await run(`UPDATE users SET name = ? WHERE id = ?`, [displayName, user.id]);
    }
    
    // Check if user_settings exists
    const existingSettings = await get(`SELECT user_id FROM user_settings WHERE user_id = ?`, [user.id]);
    
    if (existingSettings) {
      // Update existing settings
      await run(
        `UPDATE user_settings SET 
          phone = ?,
          language = ?,
          timezone = ?,
          date_format = ?,
          currency = ?,
          email_notifications = ?,
          push_notifications = ?,
          lesson_reminders = ?,
          payment_alerts = ?,
          weekly_report = ?
        WHERE user_id = ?`,
        [
          phone || '',
          language || 'uk',
          timezone || 'Europe/Kyiv',
          dateFormat || 'DD.MM.YYYY',
          currency || 'UAH',
          emailNotifications ? 1 : 0,
          pushNotifications ? 1 : 0,
          lessonReminders ? 1 : 0,
          paymentAlerts ? 1 : 0,
          weeklyReport ? 1 : 0,
          user.id
        ]
      );
    } else {
      // Insert new settings
      await run(
        `INSERT INTO user_settings (
          user_id,
          phone,
          language,
          timezone,
          date_format,
          currency,
          email_notifications,
          push_notifications,
          lesson_reminders,
          payment_alerts,
          weekly_report
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          user.id,
          phone || '',
          language || 'uk',
          timezone || 'Europe/Kyiv',
          dateFormat || 'DD.MM.YYYY',
          currency || 'UAH',
          emailNotifications ? 1 : 0,
          pushNotifications ? 1 : 0,
          lessonReminders ? 1 : 0,
          paymentAlerts ? 1 : 0,
          weeklyReport ? 1 : 0,
        ]
      );
    }
    
    return NextResponse.json({
      message: 'Налаштування успішно збережено',
    });
  } catch (error) {
    console.error('Update settings error:', error);
    return NextResponse.json(
      { error: ERROR_MESSAGES.updateFailed },
      { status: 500 }
    );
  }
}
