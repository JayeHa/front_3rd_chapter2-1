import { MutableRefObject, useCallback, useEffect, useRef } from 'react';
import { StockListType } from '../model/product';
import { UpdateStockPrice } from './useStockData';

type Props = {
  stockList: StockListType;
  lastSelectedId: string | undefined;
  updateStockPrice: UpdateStockPrice;
};

const SALE = {
  FLASH: {
    CHANCE: 0.3,
    DISCOUNT: 0.2,
    INTERVAL: 30000, // 30초
    DELAY: 10000, // 10초 이내 랜덤
  },

  SUGGESTION: {
    DISCOUNT: 0.05,
    INTERVAL: 60000, // 60초
    DELAY: 20000, // 20초 이내 랜덤
  },
} as const;

/**
 * 번개 세일 및 추천 상품 세일 이벤트를 초기화하는 훅
 */
export const useInitializeSales = ({
  lastSelectedId,
  stockList,
  updateStockPrice,
}: Props) => {
  const flashSaleTimeoutRef = useRef<number | null>(null);
  const suggestionSaleTimeoutRef = useRef<number | null>(null);

  const clearTimers = useCallback(() => {
    if (flashSaleTimeoutRef.current) clearTimeout(flashSaleTimeoutRef.current);
    if (suggestionSaleTimeoutRef.current)
      clearTimeout(suggestionSaleTimeoutRef.current);
  }, []);

  /** 타이머와 인터벌을 설정하는 함수 */
  const setTimedInterval = useCallback(
    (
      callback: TimerHandler,
      {
        ref,
        delay,
        intervalTime,
      }: {
        ref: MutableRefObject<number | null>;
        delay: number;
        intervalTime: number;
      }
    ) => {
      ref.current = setTimeout(() => {
        const interval = setInterval(callback, intervalTime);
        return () => clearInterval(interval);
      }, delay);
    },
    []
  );

  /** 번개 세일 시작 */
  const startFlashSale = useCallback(
    (stockList: StockListType) => {
      setTimedInterval(
        () => {
          const discountItem =
            stockList[Math.floor(Math.random() * stockList.length)];
          if (Math.random() < SALE.FLASH.CHANCE && discountItem.quantity > 0) {
            alert(
              `번개세일! ${discountItem.name}이(가) ${SALE.FLASH.DISCOUNT * 100}% 할인 중입니다!`
            );
            updateStockPrice(discountItem.id, () =>
              Math.round(discountItem.price * (1 - SALE.FLASH.DISCOUNT))
            );
          }
        },
        {
          delay: Math.random() * SALE.FLASH.DELAY,
          intervalTime: SALE.FLASH.INTERVAL,
          ref: flashSaleTimeoutRef,
        }
      );
    },
    [setTimedInterval, updateStockPrice]
  );

  /** 추천 상품 세일 시작 */
  const startSuggestionSale = useCallback(
    (stockList: StockListType, lastSelectedId: string | undefined) => {
      setTimedInterval(
        () => {
          if (!lastSelectedId) return;
          const discountItem = stockList.find(
            (item) => item.id !== lastSelectedId && item.quantity > 0
          );
          if (discountItem) {
            alert(
              `${discountItem.name}은(는) 어떠세요? 지금 구매하시면 ${SALE.SUGGESTION.DISCOUNT * 100}% 추가 할인!`
            );
            updateStockPrice(discountItem.id, () =>
              Math.round(discountItem.price * (1 - SALE.SUGGESTION.DISCOUNT))
            );
          }
        },
        {
          delay: Math.random() * SALE.SUGGESTION.DELAY,
          intervalTime: SALE.SUGGESTION.INTERVAL,
          ref: suggestionSaleTimeoutRef,
        }
      );
    },
    [setTimedInterval, updateStockPrice]
  );

  useEffect(() => {
    startFlashSale(stockList);
    startSuggestionSale(stockList, lastSelectedId);

    return () => clearTimers();
  }, [
    clearTimers,
    lastSelectedId,
    startFlashSale,
    startSuggestionSale,
    stockList,
  ]);
};
