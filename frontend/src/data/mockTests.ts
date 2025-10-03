export type Question = {
    text: string;
    options: string[];
    correctIndex: number;
  };
  
  export type Test = {
    id: string;
    title: string;
    description: string;
    category: string;
    ageGroup?: string;
    questions: Question[];
  };
  
  export const mockTests: Test[] = [
    {
      id: 'adults-basic',
      title: 'Основы финансовой грамотности',
      description: 'Тест для взрослых',
      category: 'adults',
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
    },
    {
      id: 'school-5-10',
      title: 'Финансовая грамотность для детей 5-10 лет',
      description: 'Базовые понятия для младших школьников',
      category: 'school',
      ageGroup: '5-10',
      questions: [
        {
          text: 'Что такое деньги?',
          options: [
            'Бумажки для рисования',
            'Средство для покупки товаров',
            'Игрушки',
            'Книги'
          ],
          correctIndex: 1
        },
        {
          text: 'Где можно хранить деньги?',
          options: [
            'Под подушкой',
            'В копилке',
            'В банке',
            'Все варианты верны'
          ],
          correctIndex: 3
        }
      ]
    },
    {
      id: 'school-11-14',
      title: 'Финансовая грамотность для подростков 11-14 лет',
      description: 'Основы управления деньгами',
      category: 'school',
      ageGroup: '11-14',
      questions: [
        {
          text: 'Что такое бюджет?',
          options: [
            'Список покупок',
            'План доходов и расходов',
            'Счет в банке',
            'Кредитная карта'
          ],
          correctIndex: 1
        }
      ]
    },
    {
      id: 'school-15-18',
      title: 'Финансовая грамотность для старшеклассников 15-18 лет',
      description: 'Продвинутые финансовые знания',
      category: 'school',
      ageGroup: '15-18',
      questions: [
        {
          text: 'Что такое инвестиции?',
          options: [
            'Трата денег',
            'Вложение денег для получения прибыли',
            'Покупка еды',
            'Оплата коммунальных услуг'
          ],
          correctIndex: 1
        }
      ]
    },
    {
      id: 'seniors-basic',
      title: 'Финансовая грамотность для пенсионеров',
      description: 'Управление финансами в пенсионном возрасте',
      category: 'seniors',
      questions: [
        {
          text: 'Что такое пенсия?',
          options: [
            'Зарплата',
            'Ежемесячные выплаты пенсионерам',
            'Подарок от государства',
            'Кредит'
          ],
          correctIndex: 1
        }
      ]
    }
  ];