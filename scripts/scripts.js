document.querySelectorAll('.points-value').forEach(element => {
    const maxLength = 9;
    let lastValidValue = element.textContent.replace(/,/g, '');
  
    element.dataset.rawValue = lastValidValue;
  
    element.addEventListener('focus', function() {
      this.textContent = this.dataset.rawValue;
      
      setCursorToEnd(this);
    });
  
    element.addEventListener('blur', function() {
      let rawValue = this.textContent.replace(/[^0-9]/g, '');
      if(!rawValue || isNaN(rawValue)) {
        rawValue = lastValidValue;
      }
      
      rawValue = rawValue.slice(0, maxLength);
      
      this.dataset.rawValue = rawValue;
      lastValidValue = rawValue;
      
      this.textContent = formatNumber(rawValue);
    });
  
    element.addEventListener('input', function() {
      let rawValue = this.textContent.replace(/[^0-9]/g, '');
      rawValue = rawValue.slice(0, maxLength);
      this.dataset.rawValue = rawValue;
      this.textContent = rawValue;
      
      setCursorToEnd(this);
    });
  
    function setCursorToEnd(el) {
      const range = document.createRange();
      const selection = window.getSelection();
      range.selectNodeContents(el);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  
    function formatNumber(num) {
      return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
  });

  document.querySelectorAll('.nft-amount').forEach(element => {
    const maxLength = parseInt(element.getAttribute('data-maxlength')) || 3;
    
    let lastValidValue = element.getAttribute('data-value') || '0';
    
    element.addEventListener('focus', function() {
      if(this.textContent === '0') {
        this.textContent = '';
      }
      this.dataset.cursorPos = '0';
    });
    
    element.addEventListener('blur', function() {
      if(this.textContent.trim() === '' || isNaN(this.textContent)) {
        this.textContent = lastValidValue;
      } else {
        lastValidValue = this.textContent;
        this.setAttribute('data-value', this.textContent);
      }
    });
    
    element.addEventListener('input', function(e) {
      let newValue = this.textContent.replace(/[^0-9]/g, '');
      
      if(newValue.length > maxLength) {
        newValue = newValue.slice(0, maxLength);
      }
      
      if(newValue !== this.textContent) {
        const cursorPos = parseInt(this.dataset.cursorPos) || 0;
        this.textContent = newValue;
        
        const range = document.createRange();
        const sel = window.getSelection();
        range.setStart(this.childNodes[0], Math.min(cursorPos, newValue.length));
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
      }
      
      lastValidValue = this.textContent;
      this.setAttribute('data-value', this.textContent);
    });
    
    element.addEventListener('keydown', function() {
      const sel = window.getSelection();
      if(sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        this.dataset.cursorPos = range.startOffset;
      }
    });
    
    element.addEventListener('paste', function(e) {
      e.preventDefault();
      const text = (e.clipboardData || window.clipboardData).getData('text');
      const numbers = text.replace(/[^0-9]/g, '');
      const newValue = numbers.slice(0, maxLength);
      document.execCommand('insertText', false, newValue);
    });
  });

  document.addEventListener('DOMContentLoaded', function() {
    const slider = document.getElementById('distribution-slider');
    const nftPercent = document.getElementById('nft-percent');
    const pointsPercent = document.getElementById('points-percent');
    const sliderProgress = document.querySelector('.slider-progress');
    const sliderRemaining = document.querySelector('.slider-remaining');
  
    slider.addEventListener('input', function() {
      const value = this.value;
      nftPercent.textContent = value;
      pointsPercent.textContent = 100 - value;
      
      sliderProgress.style.width = `${value}%`;
      sliderRemaining.style.width = `${100 - value}%`;
      
      updateCalculations(value, 100-value);
    });
  
    function updateCalculations(nftPercent, pointsPercent) {
      console.log(`NFT: ${nftPercent}%, Points: ${pointsPercent}%`);
    }
  });

  function getSafeTextContent(selector) {
    const element = document.querySelector(selector);
    return element ? element.textContent : '0';
  }
  
  function calculateTokenAllocation() {
    try {
      const nftData = [
        { name: "Operator", totalSupply: 75, multiplier: 600, selector: '.nft-item:nth-child(5) .nft-amount' },
        { name: "Strider", totalSupply: 425, multiplier: 100, selector: '.nft-item:nth-child(4) .nft-amount' },
        { name: "Collector", totalSupply: 3398, multiplier: 10, selector: '.nft-item:nth-child(3) .nft-amount' },
        { name: "Explorer", totalSupply: 9998, multiplier: 1, selector: '.nft-item:nth-child(2) .nft-amount' }
      ];
  
      const nftPercent = parseInt(getSafeTextContent('#nft-percent')) || 0;
      const pointsPercent = parseInt(getSafeTextContent('#points-percent')) || 0;
  
      const totalSupply = 1000000000;
      
      const nftTGEAllocation = totalSupply * 0.01 * nftPercent * 0.1;
      const pointsAllocation = totalSupply * 0.01 * pointsPercent * 0.1;
      const nftVestedAllocation = totalSupply * 0.1; 
  
      let totalWeight = 0;
      nftData.forEach(nft => {
        totalWeight += nft.totalSupply * nft.multiplier;
      });
  
      let userWeight = 0;
      nftData.forEach(nft => {
        const amount = parseInt(getSafeTextContent(nft.selector)) || 0;
        userWeight += amount * nft.multiplier;
      });
  
      const userNFTTGETokens = totalWeight > 0 ? (userWeight / totalWeight) * nftTGEAllocation : 0;
      const userNFTVestedTokens = totalWeight > 0 ? (userWeight / totalWeight) * nftVestedAllocation : 0;

      const yourPoints = parseInt(getSafeTextContent('.points-row:nth-child(1) .points-value').replace(/,/g, '')) || 0;
      const totalPoints = parseInt(getSafeTextContent('.points-row:nth-child(2) .points-value').replace(/,/g, '')) || 1;
      const userPointsTokens = (yourPoints / totalPoints) * pointsAllocation;
  
      const fdvDropdown = document.querySelector('.fdv-dropdown');
      const fdvValue = fdvDropdown ? parseInt(fdvDropdown.value) : 100000000;
      const tokenPrice = fdvValue / totalSupply;
  
      const updateUI = (selector, value, isCurrency = false) => {
        const element = document.querySelector(selector);
        if (element) {
          element.textContent = isCurrency 
            ? `$${value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}` 
            : Math.round(value).toLocaleString();
        }
      };
  
      updateUI('.token-rectangle:nth-child(1) .token-amount', userPointsTokens);
      updateUI('.token-rectangle:nth-child(2) .token-amount', userNFTTGETokens);
      updateUI('#vested-amount', userNFTVestedTokens);
      
      updateUI('.token-result-row:nth-child(1) .token-result-value', userPointsTokens * tokenPrice, true);
      updateUI('.token-result-row:nth-child(2) .token-result-value', userNFTTGETokens * tokenPrice, true);
      updateUI('.token-result-row:nth-child(3) .token-result-value', userNFTVestedTokens * tokenPrice, true);
      updateUI('.token-total-value', (userPointsTokens + userNFTTGETokens + userNFTVestedTokens) * tokenPrice, true);
  
    } catch (error) {
      console.error('ERROR', error);
    }
  }

  document.addEventListener('DOMContentLoaded', function() {
    const calculateBtn = document.querySelector('.calculate-btn');
    if (calculateBtn) {
      calculateBtn.addEventListener('click', calculateTokenAllocation);
    } else {
      console.error('');
    }
  
    const fdvDropdown = document.querySelector('.fdv-dropdown');
    if (fdvDropdown) {
      fdvDropdown.addEventListener('change', calculateTokenAllocation);
    } else {
      console.error('');
    }
  
    const slider = document.getElementById('distribution-slider');
    if (slider) {
      slider.addEventListener('input', function() {
        const value = parseInt(this.value);
        const nftPercent = document.getElementById('nft-percent');
        const pointsPercent = document.getElementById('points-percent');
        
        if (nftPercent && pointsPercent) {
          nftPercent.textContent = value;
          pointsPercent.textContent = 100 - value;
          calculateTokenAllocation();
        }
      });
    } else {
      console.error('');
    }
  });