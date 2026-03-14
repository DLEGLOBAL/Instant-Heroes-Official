
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { ComicFace, TOTAL_PAGES } from './types';
import { Panel } from './Panel';

interface BookProps {
    comicFaces: ComicFace[];
    currentSheetIndex: number;
    isStarted: boolean;
    isSetupVisible: boolean;
    onSheetClick: (index: number) => void;
    onOpenBook: () => void;
    onDownloadPDF: () => void;
    onDownloadHTML: () => void;
    onReset: () => void;
    onRegenerate: (pageIndex: number) => void;
    onRegenerateVideo?: (faceId: string, imageUrl: string, sceneDesc: string) => void;
}

export const Book: React.FC<BookProps> = (props) => {
    const sheetsToRender = [];
    if (props.comicFaces.length > 0) {
        sheetsToRender.push({ front: props.comicFaces[0], back: props.comicFaces.find(f => f.pageIndex === 1) });
        for (let i = 2; i <= TOTAL_PAGES; i += 2) {
            sheetsToRender.push({ front: props.comicFaces.find(f => f.pageIndex === i), back: props.comicFaces.find(f => f.pageIndex === i + 1) });
        }
    } else if (props.isSetupVisible) {
        // Placeholder sheet for initial render behind setup
        sheetsToRender.push({ front: undefined, back: undefined });
    }

    return (
        <div className={`book ${props.currentSheetIndex > 0 ? 'opened' : ''} transition-all duration-1000 ease-in-out`}
           style={ (props.isSetupVisible) ? { transform: 'translateZ(-600px) translateY(-100px) rotateX(20deg) scale(0.9)', filter: 'blur(6px) brightness(0.7)', pointerEvents: 'none' } : {}}>
          {sheetsToRender.map((sheet, i) => (
              <div key={i} className={`paper ${i < props.currentSheetIndex ? 'flipped' : ''}`} style={{ zIndex: i < props.currentSheetIndex ? i : sheetsToRender.length - i }}
                   onClick={() => props.onSheetClick(i)}>
                  <div className="front">
                      <Panel face={sheet.front} allFaces={props.comicFaces} onOpenBook={props.onOpenBook} onDownloadPDF={props.onDownloadPDF} onDownloadHTML={props.onDownloadHTML} onReset={props.onReset} onRegenerate={props.onRegenerate} onRegenerateVideo={props.onRegenerateVideo} />
                  </div>
                  <div className="back">
                      <Panel face={sheet.back} allFaces={props.comicFaces} onOpenBook={props.onOpenBook} onDownloadPDF={props.onDownloadPDF} onDownloadHTML={props.onDownloadHTML} onReset={props.onReset} onRegenerate={props.onRegenerate} onRegenerateVideo={props.onRegenerateVideo} />
                  </div>
              </div>
          ))}
      </div>
    );
}
