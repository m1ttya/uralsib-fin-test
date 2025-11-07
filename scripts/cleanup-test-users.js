const { query } = require('../backend/src/db');

async function cleanupTestUsers() {
  try {
    console.log('🧹 Очистка тестовых пользователей...\n');

    // Получаем всех пользователей
    const users = await query('SELECT user_id, email, name, created_at FROM users');
    console.log(`Всего пользователей в БД: ${users.rows.length}\n`);

    // Показываем всех пользователей
    users.rows.forEach((user, idx) => {
      const date = new Date(user.created_at).toLocaleString();
      console.log(`${idx + 1}. ${user.email} (${user.name}) - создан: ${date}`);
    });

    // Удаляем тестовых пользователей (выбираем по email или дате)
    const testEmails = users.rows
      .filter(u => u.email?.includes('@example.') || u.email?.includes('@test.') || u.email?.includes('@123.') || u.email?.includes('@temp.'))
      .map(u => u.user_id);

    const oldUsers = users.rows
      .filter(u => {
        const createdAt = new Date(u.created_at);
        const daysAgo = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
        return daysAgo > 3; // удаляем пользователей старше 3 дней
      })
      .map(u => u.user_id);

    // Объединяем и удаляем дубликаты
    const allUsersToDelete = [...testEmails, ...oldUsers];
    const usersToDelete = [...new Set(allUsersToDelete)];

    if (usersToDelete.length === 0) {
      console.log('\n✅ Нет пользователей для удаления');
      return;
    }

    console.log(`\n⚠️  Пользователи для удаления: ${usersToDelete.length}`);
    console.log('ID:', usersToDelete.join(', '));

    // Подтверждение
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const answer = await new Promise(resolve => {
      rl.question('\nПродолжить удаление? (yes/no): ', resolve);
    });
    rl.close();

    if (answer.toLowerCase() !== 'yes' && answer.toLowerCase() !== 'y') {
      console.log('❌ Отменено');
      return;
    }

    // Удаляем для каждого пользователя отдельно (для совместимости с SQLite)
    console.log('\n🗑️  Удаляем связанные данные и пользователей...');

    for (const userId of usersToDelete) {
      console.log(`  Удаляем пользователя ID ${userId}...`);

      try {
        // Удаляем refresh tokens
        await query('DELETE FROM refresh_tokens WHERE user_id = ?', [userId]);

        // Удаляем результаты тестов
        await query('DELETE FROM test_results WHERE user_id = ?', [userId]);

        // Удаляем курсы пользователей
        await query('DELETE FROM user_courses WHERE user_id = ?', [userId]);

        // Удаляем пользователя
        await query('DELETE FROM users WHERE user_id = ?', [userId]);

        console.log(`  ✅ Пользователь ID ${userId} удален`);
      } catch (error) {
        console.error(`  ❌ Ошибка при удалении пользователя ${userId}:`, error.message);
      }
    }

    console.log('\n✅ Очистка завершена!');

  } catch (error) {
    console.error('❌ Ошибка:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

cleanupTestUsers();
