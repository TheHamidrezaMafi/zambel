'use client';

import { useState } from 'react';
import { MdShowChart } from 'react-icons/md';
import { IoClose } from 'react-icons/io5';
import PriceHistoryChart from '../price-history-chart/PriceHistoryChart';

interface PriceHistoryModalProps {
  flightNumber: string;
  date: string;
  origin: string;
  destination: string;
}

const PriceHistoryModal = ({
  flightNumber,
  date,
  origin,
  destination,
}: PriceHistoryModalProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 glass-strong hover:bg-primary/20 rounded-lg transition-all group"
        title="مشاهده تاریخچه قیمت"
      >
        <MdShowChart className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
        <span className="text-xs font-medium text-muted-foreground group-hover:text-primary transition-colors">
          تاریخچه قیمت
        </span>
      </button>

      {/* Modal */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="w-full max-w-4xl max-h-[90vh] overflow-y-auto glass-strong rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between p-4 glass-strong border-b border-white/10 rounded-t-2xl">
              <div className="flex items-center gap-2">
                <MdShowChart className="w-6 h-6 text-primary" />
                <div>
                  <h2 className="text-lg font-bold text-foreground">تاریخچه قیمت پرواز</h2>
                  <p className="text-xs text-muted-foreground">
                    پرواز {flightNumber} • {origin} به {destination}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-secondary/80 rounded-lg transition-colors"
              >
                <IoClose className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6">
              <PriceHistoryChart
                flightNumber={flightNumber}
                date={date}
                origin={origin}
                destination={destination}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PriceHistoryModal;
