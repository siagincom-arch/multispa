import { useCallback, useEffect, useRef, useState } from "react";

interface ScrollState {
    isAtBottom: boolean;
    autoScrollEnabled: boolean;
}

interface UseAutoScrollOptions {
    offset?: number;
    smooth?: boolean;
    content?: React.ReactNode;
}

export function useAutoScroll(options: UseAutoScrollOptions = {}) {
    const { offset = 20, smooth = false, content } = options;
    const scrollRef = useRef<HTMLDivElement>(null);
    const lastContentHeight = useRef(0);
    const userHasScrolled = useRef(false);
    const autoScrollRef = useRef(true);

    const [scrollState, setScrollState] = useState<ScrollState>({
        isAtBottom: true,
        autoScrollEnabled: true,
    });

    const checkIsAtBottom = useCallback(
        (element: HTMLElement) => {
            const { scrollTop, scrollHeight, clientHeight } = element;
            const distanceToBottom = Math.abs(
                scrollHeight - scrollTop - clientHeight
            );
            return distanceToBottom <= offset;
        },
        [offset]
    );

    const scrollToBottom = useCallback(
        (instant?: boolean) => {
            if (!scrollRef.current) return;

            const targetScrollTop =
                scrollRef.current.scrollHeight - scrollRef.current.clientHeight;

            if (instant) {
                scrollRef.current.scrollTop = targetScrollTop;
            } else {
                scrollRef.current.scrollTo({
                    top: targetScrollTop,
                    behavior: smooth ? "smooth" : "auto",
                });
            }

            autoScrollRef.current = true;
            setScrollState({
                isAtBottom: true,
                autoScrollEnabled: true,
            });
            userHasScrolled.current = false;
        },
        [smooth]
    );

    const handleScroll = useCallback(() => {
        if (!scrollRef.current) return;

        const atBottom = checkIsAtBottom(scrollRef.current);

        autoScrollRef.current = atBottom ? true : autoScrollRef.current;
        setScrollState((prev) => ({
            isAtBottom: atBottom,
            autoScrollEnabled: atBottom ? true : prev.autoScrollEnabled,
        }));
    }, [checkIsAtBottom]);

    useEffect(() => {
        const element = scrollRef.current;
        if (!element) return;

        element.addEventListener("scroll", handleScroll, { passive: true });
        return () => element.removeEventListener("scroll", handleScroll);
    }, [handleScroll]);

    // Auto-scroll when content changes (use ref to avoid re-triggering)
    useEffect(() => {
        const scrollElement = scrollRef.current;
        if (!scrollElement) return;

        const currentHeight = scrollElement.scrollHeight;
        const hasNewContent = currentHeight !== lastContentHeight.current;

        if (hasNewContent) {
            if (autoScrollRef.current) {
                requestAnimationFrame(() => {
                    scrollToBottom(lastContentHeight.current === 0);
                });
            }
            lastContentHeight.current = currentHeight;
        }
    }, [content, scrollToBottom]);

    // Resize observer uses ref too
    useEffect(() => {
        const element = scrollRef.current;
        if (!element) return;

        const resizeObserver = new ResizeObserver(() => {
            if (autoScrollRef.current) {
                scrollToBottom(true);
            }
        });

        resizeObserver.observe(element);
        return () => resizeObserver.disconnect();
    }, [scrollToBottom]);

    const disableAutoScroll = useCallback(() => {
        const atBottom = scrollRef.current
            ? checkIsAtBottom(scrollRef.current)
            : false;

        if (!atBottom) {
            userHasScrolled.current = true;
            autoScrollRef.current = false;
            setScrollState((prev) => ({
                ...prev,
                autoScrollEnabled: false,
            }));
        }
    }, [checkIsAtBottom]);

    return {
        scrollRef,
        isAtBottom: scrollState.isAtBottom,
        autoScrollEnabled: scrollState.autoScrollEnabled,
        scrollToBottom: () => scrollToBottom(false),
        disableAutoScroll,
    };
}
