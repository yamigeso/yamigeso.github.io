'use client';

import { useEffect, useState } from 'react';
import $ from 'jquery';

export default function Registration() {
  const [scrapedData, setScrapedData] = useState<any[]>([]);
  const [loadLayout, setLoadLayout] = useState<HTMLInputElement | null>(null);

  useEffect(() => {
    // コンポーネントがマウントされたときにLoadLayoutを取得
    const layoutElement = document.querySelector(".LoadLayout") as HTMLInputElement;
    setLoadLayout(layoutElement);
  }, []); // 空の依存配列で、マウント時のみ実行

  const LoadShow = () => {
    if (loadLayout) {
      loadLayout.hidden = false;
    }
  };

  const LoadHide = () => {
    if (loadLayout) {
      loadLayout.hidden = true;
    }
  };

  const fetchScrapedData = async () => {
    try {
      const tDate = document.querySelector('#targetDate') as HTMLInputElement;
      if (tDate.value === "") {
        alert("入力されていません");
        return;
      }
      LoadShow();
      const property = new Date(tDate.value).toISOString().slice(0, 10).replace(/-/g, '');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/scrape/`, {
        method: 'POST', // GET, POST, PUT, DELETEなどのHTTPメソッド
        headers: {
          'Content-Type': 'application/json' // JSONを送信する場合のContent-Type
        },
        body: JSON.stringify({ // プロパティをJSON形式に変換して送信
          targetDate: property,
        })
      });
      const data = await res.json(); // レスポンスをJSONに変換
      console.dir(data);
      LoadHide();
      // setScrapedData(data.data);  // Django APIからのデータを保存
    } catch (error) {
      console.error("Error fetching scraped data:", error);
      LoadHide(); // エラーが発生した場合もLoadHideを呼び出す
    }
  };

  function formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // 月は0から始まるので1を足す
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`; // yyyyMMdd形式で返す
}

function GetWeekEnd(year: number, month: number): string[] {
    const dates: string[] = [];
    const date = new Date(year, month - 1, 1); // 月は0から始まる
    const lastDate = new Date(year, month, 0).getDate(); // 月の最終日を取得

    for (let day = 1; day <= lastDate; day++) {
        date.setDate(day);
        const dayOfWeek = date.getDay(); // 0: 日曜日, 6: 土曜日

        if (dayOfWeek === 0 || dayOfWeek === 6) {
            dates.push(formatDate(new Date(date))); // 土日の日付をyyyyMMdd形式で追加
        }
    }

    return dates;
}

const WeekendButton: React.FC = () => {
    const [targetMonth, setTargetMonth] = useState<string>(''); // inputの値を保持

    const handleClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
        if (!targetMonth) {
            alert("月が選択されていません。");
            return;
        }

        const [year, month] = targetMonth.split('-').map(Number); // "YYYY-MM"形式を分解
        const weekends: string[] = GetWeekEnd(year, month); // 土日を取得

        try {
            LoadShow();
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/Month/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    targetMonth: weekends,
                })
            });
            const data = await res.json(); // レスポンスをJSONに変換
            console.dir(data);
            LoadHide();
        } catch (ex) {
            console.dir(ex);
            LoadHide();
        }
    };

    return (
        <div>
            <input 
                type="month" 
                id="targetM" 
                value={targetMonth}
                className='form-control'
                onChange={(e) => setTargetMonth(e.target.value)} // inputの値を更新
            />
            <button onClick={handleClick} className='btn btn-success'>
                月指定
            </button>
        </div>
    );
};

const RaceShowButton = () => {
  
  async function getRaceMovieAdmint(
    _show_id: string,
    _race_id: string,
    _course: string,
    _uagent: string
  ) {
    const _data = {
      input: "UTF-8",
      output: "jsonp",
      race_id: _race_id,
      course: _course,
      uagent: _uagent,
    };
  
    const _raceapi_action_api_movie_url = "https://race.netkeiba.com/api/api_get_race_movie_adminttv.html";
  
    try {
      const response = await $.ajax({
        type: "GET",
        url: _raceapi_action_api_movie_url,
        data: _data,
        dataType: "jsonp", // jQueryではdataTypeに"jsonp"を指定
        xhrFields: {
          withCredentials: true,
        },
        timeout: 3000, // 3秒でタイムアウト
      });
      $('#RaceArea').html(response);
    } catch (error) {
      console.error("リクエストに失敗しました:", error);
    }
  }
  
  const RaceMovieShow = (_raceId: string) => (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault(); // 必要に応じてデフォルトの動作を防ぐ
    getRaceMovieAdmint('RaceMovieDetail', _raceId, 'spremium', 'pc');
  };
  
  return <div>
    <button onClick={RaceMovieShow("202406040608")} className='btn btn-warning'>Show</button>
  </div>
}

interface YearPickerProps {
  startYear?: number;
  endYear?: number;
  onYearChange?: (year: string) => void;
}

const YearPicker: React.FC<YearPickerProps> = ({ startYear = 1900, endYear = new Date().getFullYear(), onYearChange }) => {
  const [selectedYear, setSelectedYear] = useState(endYear.toString());

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const year = event.target.value;
    setSelectedYear(year);
    if (onYearChange) onYearChange(year);
  };

  const handleClick = async () => {
    // 1から12の各月に対してGetWeekEndを呼び出す
    let array_weekends: string[] = []; // 文字列の配列として初期化
    for (let month = 1; month <= 12; month++) {
      const weekends = GetWeekEnd(Number(selectedYear), month);
      array_weekends.push(...weekends); // スプレッド構文を使って配列の中の値を展開して追加
    }
    try {
      LoadShow();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/Year/`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({
              targetYear: array_weekends,
          })
      });
      const data = await res.json(); // レスポンスをJSONに変換
      console.dir(data);
      LoadHide();
    } catch (ex) {
        console.dir(ex);
        LoadHide();
    }
  };

  const years = [];
  for (let year = endYear; year >= startYear; year--) {
    years.push(year);
  }

  return (
    <div>
      <select value={selectedYear} onChange={handleChange} className='form-select yearpicker'>
        {years.map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>
      <button onClick={handleClick} className='btn btn-danger'>
        年指定
      </button>
    </div>
  );
};

const YearPicker_10: React.FC<YearPickerProps> = ({ startYear = 1900, endYear = new Date().getFullYear(), onYearChange }) => {
  const [selectedYear, setSelectedYear] = useState(endYear.toString());

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const year = event.target.value;
    setSelectedYear(year);
    if (onYearChange) onYearChange(year);
  };

  const handleClick = async () => {
    // 1から12の各月に対してGetWeekEndを呼び出す
    let array_weekends: string[] = []; // 文字列の配列として初期化
    for(let i = 0 ; i < 10 ; i ++){
      for (let month = 1; month <= 12; month++) {
        const weekends = GetWeekEnd(Number(selectedYear) - i, month);
        array_weekends.push(...weekends); // スプレッド構文を使って配列の中の値を展開して追加
      }
    }
    try {
      LoadShow();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/Year/`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({
              targetYear: array_weekends,
          })
      });
      const data = await res.json(); // レスポンスをJSONに変換
      console.dir(data);
      LoadHide();
    } catch (ex) {
        console.dir(ex);
        LoadHide();
    }
  };

  const years = [];
  for (let year = endYear; year >= startYear; year--) {
    years.push(year);
  }

  return (
    <div>
      <select value={selectedYear} onChange={handleChange} className='form-select yearpicker'>
        {years.map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>
      <button onClick={handleClick} className='btn btn-danger'>
        10年分
      </button>
    </div>
  );
};

const AlertDataShow = () => {
  const [data, setData] = useState<any>(null); // 初期値はnull

  const handleClick = async () => {
    try {
      LoadShow();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/Mod/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await res.json(); // レスポンスをJSONに変換
      setData(data);
      LoadHide();
    } catch (ex) {
      console.dir(ex);
      LoadHide();
    }
  };

  return (
    <div>
      <div>
        <button onClick={handleClick} className='btn btn-warning'>異常データ表示</button>
      </div>
      <div className='pickup' hidden={!data || data.length === 0}>
        {data && (
          <table className='table align-middle caption-top'>
            <caption><b>ラップタイム異常</b></caption>
            <thead>
              <tr>
                <th>#</th>
                <th>Race_Id</th>
                <th>LapTime</th>
                <th>PaceTime</th>
              </tr>
            </thead>
            <tbody>
              {data.Lap.map((item: any, index: number) => (
                <tr key={index}>
                  <td><button className='btn btn-secondary'>修正</button></td>
                  <td>{item.Race_Id}</td>
                  <td>{item.LapTime}</td>
                  <td>{item.PaceTime}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

return (
  <div>
    <h1></h1>
    <div className='Group'>
      <div>
        <input type='date' id='targetDate' className='form-control'></input>
        <button onClick={fetchScrapedData} className='btn btn-primary'>日指定</button>
      </div>
      <WeekendButton />
      <YearPicker />
      <YearPicker_10 />
      <AlertDataShow />
      <RaceShowButton />      
    </div>
    <div id='RaceArea'>
    </div>
  </div>
  );
}
