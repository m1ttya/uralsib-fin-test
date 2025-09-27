export type Question = {
    text: string;
    options: string[];
    correctIndex: number;
  };
  
  export type Test = {
    id: string;
    title: string;
    description: string;
    questions: Question[];
  };
  
  export const mockTests: Test[] = [
    {
      id: 'basic',
      title: 'Основы финансовой грамотности',
      description: 'Тест для взрослых',
      questions: [
        {
          text: 'Что такое инфляция?',
          options: [
            'Рост общего уровня цен',
            'Снижение курса рубля',
            'Увеличение зарплат',
            'Рост процентных ставок'
          ],
          correctIndex: 0
        },
        {
          text: 'Что такое диверсификация?',
          options: [
            'Инвестирование в один актив',
            'Распределение вложений между разными активами',
            'Сокрытие доходов',
            'Покупка валюты'
          ],
          correctIndex: 1
        },
        {
          text: 'Что такое кредитный рейтинг?',
          options: [
            'Сумма кредита',
            'Оценка надёжности заёмщика',
            'Процент по вкладу',
            'Лимит по карте'
          ],
          correctIndex: 1
        }
      ]
    }
  ];