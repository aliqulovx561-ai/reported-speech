export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  try {
    const { name, score, total, timeUsed, answers, percentage } = req.body;

    // Get Telegram credentials
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      console.error('Telegram credentials not set');
      return res.status(200).json({
        success: true,
        message: 'Test submitted successfully',
        telegramSent: false
      });
    }

    // Calculate statistics
    const correctCount = answers.filter(a => a.isCorrect).length;
    const wrongCount = total - correctCount;
    const accuracy = Math.round((correctCount / total) * 100);

    // Create report
    const now = new Date();
    const testDate = now.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const testTime = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });

    let report = `📊 *REPORTED SPEECH TEST RESULTS*\n\n`;
    
    report += `*Student:* ${name}\n`;
    report += `*Date:* ${testDate}\n`;
    report += `*Time:* ${testTime}\n`;
    report += `*Duration:* ${timeUsed}\n\n`;
    
    report += `*SCORE SUMMARY*\n`;
    report += `━━━━━━━━━━━━━━━━\n`;
    report += `✅ Correct: ${correctCount}/${total}\n`;
    report += `❌ Wrong: ${wrongCount}/${total}\n`;
    report += `🎯 Score: ${score}/${total} (${percentage}%)\n`;
    report += `📈 Accuracy: ${accuracy}%\n\n`;
    
    // Performance Rating
    let rating = '';
    if (percentage >= 90) rating = '🏆 EXCELLENT';
    else if (percentage >= 80) rating = '🎯 VERY GOOD';
    else if (percentage >= 70) rating = '👍 GOOD';
    else if (percentage >= 60) rating = '📚 SATISFACTORY';
    else rating = '📖 NEEDS PRACTICE';
    
    report += `*Performance:* ${rating}\n\n`;
    
    // Show 3 incorrect answers with explanations
    const incorrectAnswers = answers.filter(a => !a.isCorrect).slice(0, 3);
    if (incorrectAnswers.length > 0) {
      report += `*AREAS TO IMPROVE:*\n`;
      incorrectAnswers.forEach((answer, index) => {
        report += `${index + 1}. ${answer.question}\n`;
        report += `   ❌ Student: ${answer.userAnswer}\n`;
        report += `   ✅ Correct: ${answer.correctAnswer}\n`;
        report += `   💡 ${answer.explanation}\n\n`;
      });
    }
    
    report += `━━━━━━━━━━━━━━━━\n`;
    report += `Test completed! Review your answers for better understanding.`;

    // Send to Telegram
    try {
      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: report,
          parse_mode: 'Markdown',
          disable_web_page_preview: true
        })
      });

      return res.status(200).json({
        success: true,
        message: 'Report sent to Telegram',
        telegramSent: true
      });

    } catch (error) {
      console.error('Telegram error:', error);
      return res.status(200).json({
        success: true,
        message: 'Report submitted (Telegram failed)',
        telegramSent: false
      });
    }

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}
