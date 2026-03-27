"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";

export function WalletConnectButton() {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        mounted,
      }) => {
        const ready = mounted;
        const connected = ready && account && chain;

        return (
          <div
            {...(!ready && {
              "aria-hidden": true,
              style: {
                opacity: 0,
                pointerEvents: "none" as const,
                userSelect: "none" as const,
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <button
                    onClick={openConnectModal}
                    className="group relative flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:border-indigo-300 hover:shadow-md hover:scale-105 active:scale-95"
                    title="Connect Wallet"
                  >
                    <svg className="h-[18px] w-[18px] text-gray-500 group-hover:text-indigo-600 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <rect x="2" y="6" width="20" height="14" rx="3" />
                      <path d="M2 10h20" />
                      <circle cx="17" cy="15" r="1.5" fill="currentColor" />
                      <path d="M6 6V5a3 3 0 013-3h6a3 3 0 013 3v1" strokeLinecap="round" />
                    </svg>
                  </button>
                );
              }

              if (chain.unsupported) {
                return (
                  <button
                    onClick={openChainModal}
                    className="relative flex h-10 w-10 items-center justify-center rounded-xl border-2 border-red-200 bg-red-50 shadow-sm transition-all hover:bg-red-100 hover:shadow-md active:scale-95"
                    title="Wrong Network"
                  >
                    <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                      <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
                    </span>
                    <svg className="h-[18px] w-[18px] text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </button>
                );
              }

              return (
                <div className="flex items-center gap-1.5">
                  {/* 链图标按钮 */}
                  <button
                    onClick={openChainModal}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:border-indigo-300 hover:shadow-md active:scale-95"
                    title={chain.name ?? "Switch Chain"}
                  >
                    {chain.hasIcon && chain.iconUrl ? (
                      <div
                        className="h-5 w-5 overflow-hidden rounded-full"
                        style={{ background: chain.iconBackground }}
                      >
                        <img
                          alt={chain.name ?? "Chain"}
                          src={chain.iconUrl}
                          className="h-5 w-5"
                        />
                      </div>
                    ) : (
                      <svg className="h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.6 9h16.8M3.6 15h16.8" />
                      </svg>
                    )}
                  </button>

                  {/* 账户按钮 */}
                  <button
                    onClick={openAccountModal}
                    className="group relative flex h-10 items-center gap-2 rounded-xl border border-gray-200 bg-white pl-3 pr-3.5 shadow-sm transition-all hover:border-indigo-300 hover:shadow-md active:scale-95"
                    title={account.displayName}
                  >
                    <span className="relative flex h-2.5 w-2.5 shrink-0">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-50" />
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.5)]" />
                    </span>
                    <span className="font-mono text-xs font-medium text-gray-700">{account.displayName}</span>
                  </button>
                </div>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
