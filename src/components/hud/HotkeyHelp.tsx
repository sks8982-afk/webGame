"use client";

import { useState } from "react";

export default function HotkeyHelp() {
  const [open, setOpen] = useState(false);

  return (
    <div className="absolute top-16 right-4 z-10">
      <button
        onClick={() => setOpen(!open)}
        className="px-2 py-1 bg-gray-800/90 hover:bg-gray-700 rounded border border-gray-600 text-xs font-bold"
      >
        {open ? "✕ 닫기" : "? 단축키"}
      </button>

      {open && (
        <div className="absolute right-0 top-9 w-64 bg-gray-900/95 border-2 border-gray-600 rounded-lg p-3 text-xs shadow-xl">
          <div className="text-gray-400 font-bold mb-2">키보드 단축키</div>

          <div className="mb-2">
            <div className="text-[10px] text-gray-500 mb-1">타워 선택</div>
            <div className="flex gap-1 flex-wrap">
              {["1","2","3","4","5","6","7","8"].map((k, i) => (
                <span key={k} className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-yellow-600 text-gray-900 rounded text-[10px] font-bold">{k}</kbd>
                  <span className="text-[10px] text-gray-300">
                    {["궁수","마법사","대포","냉기","독","테슬라","폭탄","지원"][i]}
                  </span>
                </span>
              ))}
            </div>
          </div>

          <div className="mb-2">
            <div className="text-[10px] text-gray-500 mb-1">액티브 스킬 (습득시)</div>
            <div className="space-y-0.5">
              {[
                ["Q", "메테오"], ["W", "천둥폭풍"], ["E", "광폭화"],
                ["R", "수호천사"], ["A", "지진"], ["S", "시간왜곡"], ["D", "아마게돈"],
              ].map(([k, name]) => (
                <div key={k} className="flex items-center gap-2">
                  <kbd className="px-1.5 py-0.5 bg-purple-700 text-white rounded text-[10px] font-bold w-6 text-center">{k}</kbd>
                  <span className="text-[10px] text-gray-300">{name}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="text-[10px] text-gray-500 mb-1">기타</div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <kbd className="px-1.5 py-0.5 bg-blue-600 text-white rounded text-[10px] font-bold">Space</kbd>
                <span className="text-[10px] text-gray-300">일시정지 / 재개</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-1.5 py-0.5 bg-gray-600 text-white rounded text-[10px] font-bold">Esc</kbd>
                <span className="text-[10px] text-gray-300">선택 해제</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
