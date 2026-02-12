// The viewer should read the quotes from the Homeschool lobby as if they are being spoken.
// The quotes then speed up to overwhelm the viewer.
// Just as it gets too fast to read, the quoted post from HR comes in as if buried by the noise.
// It's faint; drawing the eyes from a now overcrowded screen to one location.
// Fade to red for emphasis and not everyone's eyes will be able to read the HR quote

// Quotes returned from quotes.js


// Calculate the font size based on the screen type.
// I attempted a calculation but couldn't get it quite right so just hardcoded.
function calculateFontSize(viewportHeight, viewportWidth) {
    if (viewportWidth > 1024) {
        return Math.floor(viewportHeight * 0.10);
    } else if (viewportWidth > 768) {
        return Math.floor(viewportHeight * 0.065);
    } else {
        return Math.floor(viewportHeight * 0.055);
    }
}

// Again attempted a calc to get the right character lengths, but hardcoding once again
// worked better than any of my formulas.
function estimateSentenceCount(viewport, fontSize) {
    const avgCharsPerSentence = 50;
    const charsPerLine = Math.floor(viewport.width / (fontSize * 0.45));
    const totalLines = Math.floor(viewport.height / (fontSize * 1.2));
    const totalChars = charsPerLine * totalLines;
    return Math.floor(totalChars / avgCharsPerSentence);
}


// Pulling quotes at random. If it picks an already used quote it will attempt up to 10
// times to find a unique one
function getRandomUniqueQuote(arr, usedIndices) {
    let attempts = 0;
    let index;
    
    while (attempts < 10) {
        index = Math.floor(Math.random() * arr.length);
        if (!usedIndices.has(index)) {
            usedIndices.add(index);
            const quote = arr[index];
            return typeof quote === 'string' ? { text: quote, link: null } : quote;
        }
        attempts++;
    }
    
    index = Math.floor(Math.random() * arr.length);
    const quote = arr[index];
    return typeof quote === 'string' ? { text: quote, link: null } : quote;
}


// The body of the script. Selects the quotes and attempts to place the HR quote 
// somewhere in the second half of the page.
function fillQuotes() {
    const viewport = { width: window.innerWidth, height: window.innerHeight };
    const fontSize = calculateFontSize(viewport.height, viewport.width);
    const sentenceCount = estimateSentenceCount(viewport, fontSize);
    const redPosition = Math.floor(sentenceCount * 0.65);
    
    document.documentElement.style.setProperty('--font-size', `${fontSize}px`);
    
    const container = document.querySelector('.quote-container');
    container.innerHTML = '';
    
    const usedLobbyIndices = new Set();
    const usedProductIndices = new Set();
    
    const sentences = [];
    
    for (let i = 1; i <= sentenceCount; i++) {
        let quoteObj, groupLink, className;
        
        if (i === redPosition) {
            quoteObj = getRandomUniqueQuote(quotes.products.quotes, usedProductIndices);
            groupLink = quotes.products.link;
            className = 'products';
        } else {
            quoteObj = getRandomUniqueQuote(quotes.lobby.quotes, usedLobbyIndices);
            groupLink = quotes.lobby.link;
            className = 'lobby';
        }
        
        const finalLink = quoteObj.link === "none" ? null : (quoteObj.link || groupLink || DEFAULT_LINK);
        sentences.push({ text: quoteObj.text, className, link: finalLink });
    }
    
    animateWords(sentences, container);
}


// Animates the words and controls speed.
function animateWords(sentences, container) {
    const allWords = [];
    
    sentences.forEach(sentence => {
        const words = sentence.text.split(' ');
        words.forEach(word => {
            allWords.push({ word, className: sentence.className, link: sentence.link });
        });
    });
    
    const totalWords = allWords.length;
    let cumulativeDelay = 0;
    let finalDelay = 0;
    
    allWords.forEach((item, i) => {
        const span = document.createElement('span');
        span.textContent = item.word + ' ';
        span.className = item.className;
        span.style.opacity = '0';
        span.style.transition = 'opacity 0.35s';
        
        if (item.link) {
            const a = document.createElement('a');
            a.href = item.link;
            a.className = 'quote-link';
            a.appendChild(span);
            container.appendChild(a);
        } else {
            container.appendChild(span);
        }
        
        // Controls the speed at which the words are printed. The exponential speed
        // allows the page to start slow and accelerate at an overwhelming pace.
        const progress = i / totalWords;
        const inverseProgress = 1 - progress;
        let wordDelay = 400 * Math.pow(inverseProgress, 7);

        // The clustering effect gives a more spoken feel to the words. Issue when the
        // speed increases the clustering feels off, so the faster the words are printed 
        // it should decrease the clustering effect.     
        const clusteringStrength = Math.pow(inverseProgress, 3);
        const positionInCluster = i % 3;
        
        if (positionInCluster === 0 && i > 0) {
            wordDelay += 100 * clusteringStrength;
        } else {
            wordDelay *= (0.7 + (0.3 * (1 - clusteringStrength)));
        }
        
        // Max print speed
        wordDelay = Math.max(wordDelay, 50);
        
        // Slow down for the HR quote
        if (item.className === 'products') {
            wordDelay = 120;
        }
        
        cumulativeDelay += wordDelay;
        
        setTimeout(() => {
            span.style.opacity = '1';
        }, cumulativeDelay);
        
        if (i === totalWords - 1) {
            finalDelay = cumulativeDelay;
        }
    });
    
    // Fade the HR quote to red
    setTimeout(() => {
        const productSpans = container.querySelectorAll('.products');
        productSpans.forEach(span => {
            span.style.transition = 'color 2s ease';
            span.style.color = '#ff2c2c';
        });
    }, finalDelay + 250);
}

fillQuotes();
window.addEventListener('resize', fillQuotes);