'use client';

import React, { useEffect, useState, useRef } from 'react';
import DatePicker from 'react-datepicker'; 
import 'react-datepicker/dist/react-datepicker.css';

interface Race {
  href: string;       // レースのURL
  title: string;      // レースのタイトル
  race_number: string; // レース番号
}

interface RaceInfo {
  title: string;      // タイトル
  weather: string;    // 天気
  shiba: string;      // 芝
  da: string;         // ダート
}

interface DataResponse {
  races: Race[];      // Race型の配列
  race_info: RaceInfo[]; // RaceInfo型の配列
  flg: boolean;       // フラグ
}

const ThisWeek = () => {
    const [loadLayout, setLoadLayout] = useState<HTMLInputElement | null>(null);
    const [itemVisible, setItemVisible] = useState<'Item1' | 'Item2'>('Item1'); // 初期値はItem1

    useEffect(() => {
        const layoutElement = document.querySelector(".LoadLayout") as HTMLInputElement;
        setLoadLayout(layoutElement);
    }, []);

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


    const [raceName, setRaceName] = useState<string | null>(null);

    const CreateRace = async (race_id: string) => {
        try {
            LoadShow();
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/GetRace/?race=${race_id}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            const result = await res.json();
            console.dir(result);
            LoadHide();
    
            // RaceNameを取得して設定
            if (result.RaceName) {
                setRaceName(result.RaceName);
            } else {
                setRaceName(null);
            }
    
            // tableデータを処理
            if (result.table) {
                const horses = result.table['馬名'].map((_: any, index: any) => ({
                    Waku: result.table['枠'][index],
                    No: result.table['馬 番'][index],
                    HorseName: result.table['馬名'][index],
                    AgeSex: result.table['性齢'][index],
                    Weight: result.table['斤量'][index],
                    Jockey: result.table['騎手'][index],
                    Stable: result.table['厩舎'][index],
                    Turf_Result: result.Pre[index]?.Turf_Result || 'N/A',
                    Dirt_Result: result.Pre[index]?.Dirt_Result || 'N/A',
                    LastRace: result.Pre[index] ? `${result.Pre[index].Race_Nm} (${result.Pre[index].Class}) ${result.Pre[index].State} ${result.Pre[index].Clockwise} ${result.Pre[index].State}m` : '',
                    LastArrival: result.Pre[index] ? `${result.Pre[index].Arrival}` : '',
                    LastPopular: result.Pre[index] ? `${result.Pre[index].Popular}` : '',
                }));
                setTableData(horses);
                // Item1とItem2の表示を切り替える
                setItemVisible('Item2'); // Item2を表示
            } else {
                console.error("APIからのtableデータが存在しません", result.table);
                setTableData([]);
            }
        } catch (ex) {
            console.dir(ex);
            LoadHide();
        }
    };
    


    const [data, setData] = useState<DataResponse>({ races: [], race_info: [], flg: true });
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const isFetched = useRef(false);
    const [popupMessage, setPopupMessage] = useState<string | null>(null);
    const [tableData, setTableData] = useState<any[]>([]); // 出馬表のデータ

    const getFormattedDate = (date: Date): string => {
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        return `${yyyy}${mm}${dd}`;
    };

    const getDayLabel = (date: Date): string => {
        const dayOfWeek = date.getDay(); 
        switch (dayOfWeek) {
            case 0: return '日';
            case 6: return '土';
            default: return '';
        }
    };

    const getDayStyle = (date: Date): React.CSSProperties => {
        const dayOfWeek = date.getDay(); 
        if (dayOfWeek === 6) {
            return { color: 'blue' };
        } else if (dayOfWeek === 0) {
            return { color: 'red' };
        }
        return {};
    };

    const changeSaturdayDate = (increment: number) => {
        const currentDay = selectedDate.getDay(); 
        const newDate = new Date(selectedDate);

        if (increment === 1) { 
            if (currentDay === 6) {
                newDate.setDate(newDate.getDate() + 1); 
            } else if (currentDay === 0) {
                newDate.setDate(newDate.getDate() + 6); 
            } else {
                newDate.setDate(newDate.getDate() + (6 - currentDay)); 
            }
        } else if (increment === -1) { 
            if (currentDay === 6) {
                newDate.setDate(newDate.getDate() - 6); 
            } else if (currentDay === 0) {
                newDate.setDate(newDate.getDate() - 1); 
            } else {
                newDate.setDate(newDate.getDate() - (currentDay + 1)); 
            }
        }

        setSelectedDate(newDate);
        setPopupMessage(null); 
        sendSaturdayDate(newDate);
    };

    const sendSaturdayDate = async (saturdayDate: Date) => {
        const formattedDate = getFormattedDate(saturdayDate);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/ThisWeek/?saturday=${formattedDate}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            const result = await res.json();
            console.dir(result)
            if (!result.flg) {
                setPopupMessage('データが見つかりません。');
                setData({ races: [], race_info: [], flg: false });
            } else {
                setData(result);
            }
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        if (isFetched.current) return; 
        isFetched.current = true;

        const initialSaturday = new Date(); 
        const dayOfWeek = initialSaturday.getDay();
        const daysUntilSaturday = (6 - dayOfWeek + 7) % 7; 
        initialSaturday.setDate(initialSaturday.getDate() + daysUntilSaturday); 
        setSelectedDate(initialSaturday); 
        sendSaturdayDate(initialSaturday); 
    }, []);

    const CustomInput = React.forwardRef<HTMLInputElement, { value: string; onClick: () => void }>(
        ({ value, onClick }, ref) => (
            <div onClick={onClick} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <input
                    ref={ref} 
                    value={value}
                    readOnly
                    style={{ width: '100%', padding: '10px', marginRight: '10px', ...getDayStyle(selectedDate) }}
                />
                <span style={getDayStyle(selectedDate)}>{getDayLabel(selectedDate)}</span>
            </div>
        )
    );

    return (
        <div style={{ width: "60%" }}>
            <div id='Item1' hidden={itemVisible !== 'Item1'}>
                <b style={{ fontSize: "28px", borderBottom: "4px solid lightgreen" }}>レース一覧</b>
                {popupMessage && <div className="popup-message">{popupMessage}</div>}
                <div style={{ margin: '20px 0 20px', display: 'flex', alignItems: 'center' }}>
                    <button className="decrease-button pickButton" onClick={() => changeSaturdayDate(-1)}>－</button>
                    <div style={{ margin: '0 10px', cursor: 'pointer' }}>
                        <DatePicker
                            selected={selectedDate}
                            onChange={(date) => {
                                if (date) {
                                    setSelectedDate(date);
                                    setPopupMessage(null);
                                    sendSaturdayDate(date);
                                }
                            }}
                            dateFormat="yyyy/MM/dd"
                            isClearable
                            customInput={<CustomInput value={getFormattedDate(selectedDate)} onClick={() => {}} />}
                        />
                    </div>
                    <button className="increase-button pickButton" onClick={() => changeSaturdayDate(1)}>＋</button>
                </div>

                {data.flg && (
                    <div className='weekRaces'>
                        {data.race_info.map((info, index) => (
                            <div key={index} style={{ marginBottom: '20px' }} className='RaceList'>
                                <div className="race-info-container" style={{ marginBottom: '10px' }}>
                                    <h3>{info.title}</h3>
                                    <div>
                                        <p>{info.weather || ''}</p>
                                        <p>{info.shiba}</p>
                                        <p>{info.da}</p>
                                    </div>
                                </div>

                                <div className="race-items-container">
                                    {data.races
                                        .slice(index * 12, (index + 1) * 12)
                                        .map((race, raceIndex) => {
                                            const race_id = race.href.split("race_id=")[1].split("&")[0];

                                            return (
                                                <div key={`${race.href}-${race.race_number}`} className="race-item">
                                                    <b className='Race_Num'>{race.race_number}</b>
                                                    <a
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            CreateRace(race_id);
                                                        }}
                                                    >
                                                        {race.title}
                                                    </a>
                                                </div>
                                            );
                                        })}
                                </div>
                            </div>
                        ))}

                    </div>
                )}
            </div>

            <div id='Item2' hidden={itemVisible !== 'Item2'}>
                {raceName && (
                    <div style={{ width: "fit-content",marginTop: '20px', fontSize: '30px', fontWeight: 'bold',borderBottom: "4px solid lightgreen"}}>
                        {raceName}
                    </div>
                )}

                <div style={{ marginTop: '20px' }}>
                <table className='Shutuba_Table' style={{ marginTop: "20px", }}>
                    <thead>
                        <tr>
                            <th>枠番</th>
                            <th>馬番</th>
                            <th>馬名</th>
                            <th>前走</th>
                            <th>全芝</th>
                            <th>全ダ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Array.isArray(tableData) && tableData.length > 0 ? (
                            tableData.map((horse, index) => (
                                <tr key={index}>
                                    <td className={`Waku${horse.Waku}`}>{horse.Waku}</td>
                                    <td>{horse.No}</td>
                                    <td>
                                        <ul className='Shutuba_HorseInfo'>
                                            <li>{horse.HorseName}</li>
                                            <li>{horse.AgeSex}</li>
                                            <li>{horse.Weight}kg</li>
                                            <li>{horse.Jockey}</li>
                                            <li>{horse.Stable}</li>
                                        </ul>
                                    </td>
                                    <td>
                                        <ul>
                                            <li>{horse.LastRace}</li>
                                            <li>{horse.LastPopular}番人気</li>
                                            <li>{horse.LastArrival}着</li>
                                        </ul>
                                    </td>
                                    <td>{horse.Turf_Result}</td>
                                    <td>{horse.Dirt_Result}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={7}>出馬表データがありません。</td>
                            </tr>
                        )}
                    </tbody>
                </table>


                    {/* Item1とItem2の表示を切り替えるボタンを追加 */}
                    <button onClick={() => setItemVisible('Item1')} className='btn btn-secondary' style={{marginTop: "20px"}}>レース一覧に戻る</button>
                </div>
            </div>
        </div>
    );
};

export default ThisWeek;