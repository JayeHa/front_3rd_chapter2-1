// 할인 계산
const DISCOUNTS = {
  p1: 0.1,
  p2: 0.15,
  p3: 0.2,
  p4: 0.05,
  p5: 0.25,
};

export class CartList {
  constructor({ $root, productList, setProductList, updateSumDetails }) {
    this.totalPrice = 0;
    this.totalQuantity = 0;
    this.productList = productList;
    this.setProductList = setProductList;
    this.updateSumDetails = updateSumDetails;

    this.$element = document.createElement('div');
    this.$element.id = 'cart-items';
    $root.appendChild(this.$element);

    this.#calcCart();

    this.$element.addEventListener('click', (event) =>
      this.#handleCartClick(event)
    );
  }

  /** 현재 아이템에 맞는 할인율 계산 */
  #calculateDiscountRate(id, quantity) {
    if (quantity >= 10 && DISCOUNTS[id]) {
      return DISCOUNTS[id];
    }
    return 0;
  }

  /** 아이템 총 가격 계산 */
  #calculateCartItemPrice(item, quantity) {
    return (
      item.val * quantity * (1 - this.#calculateDiscountRate(item.id, quantity))
    );
  }

  /** 카트 계산 메서드 */
  #calcCart() {
    this.totalPrice = 0;
    this.totalQuantity = 0;
    let subTotal = 0;

    Array.from(this.$element.children).forEach((cartItem) => {
      const currentProduct = this.productList.find((p) => p.id === cartItem.id);
      if (currentProduct) {
        const quantity = parseInt(
          cartItem.querySelector('span').textContent.split('x ')[1]
        );
        const itemPrice = this.#calculateCartItemPrice(
          currentProduct,
          quantity
        );
        this.totalQuantity += quantity;
        subTotal += currentProduct.val * quantity;
        this.totalPrice += itemPrice;
      }
    });

    // 대량 구매 할인 적용
    const bulkDiscount = this.totalQuantity >= 30 ? 0.25 : 0;
    let discRate =
      bulkDiscount > 0 ? bulkDiscount : (subTotal - this.totalPrice) / subTotal;

    // 화요일 특별 할인 적용
    if (new Date().getDay() === 2) {
      this.totalPrice *= 0.9; // 10% 할인 적용
      discRate = Math.max(discRate, 0.1);
    }

    this.updateSumDetails({
      totalPrice: this.totalPrice,
      discount: discRate,
    });
    this.setProductList(this.productList);
  }

  /** 기존 아이템 수량 업데이트 */
  #updateExistingItem($existingItem, itemToAdd) {
    const newQuantity =
      parseInt($existingItem.querySelector('span').textContent.split('x ')[1]) +
      1;
    if (newQuantity <= itemToAdd.q) {
      $existingItem.querySelector('span').textContent =
        `${itemToAdd.name} - ${itemToAdd.val}원 x ${newQuantity}`;
      itemToAdd.q--;
    } else {
      alert('재고가 부족합니다.');
    }
  }

  /** 새로운 아이템 추가 */
  #addNewItemToCart(itemToAdd) {
    const $newItem = document.createElement('div');
    $newItem.id = itemToAdd.id;
    $newItem.className = 'flex justify-between items-center mb-2';
    $newItem.innerHTML = `
        <span>${itemToAdd.name} - ${itemToAdd.val}원 x 1</span>
        <div>
          <button class="quantity-change bg-blue-500 text-white px-2 py-1 rounded mr-1" data-product-id="${itemToAdd.id}" data-change="-1">-</button>
          <button class="quantity-change bg-blue-500 text-white px-2 py-1 rounded mr-1" data-product-id="${itemToAdd.id}" data-change="1">+</button>
          <button class="remove-item bg-red-500 text-white px-2 py-1 rounded" data-product-id="${itemToAdd.id}">삭제</button>
        </div>
      `;
    this.$element.appendChild($newItem);
    itemToAdd.q--;
  }

  /** 카트에 아이템 추가 처리 */
  handleAddToCart(itemToAdd) {
    if (itemToAdd && itemToAdd.q > 0) {
      const $existingItem = document.getElementById(itemToAdd.id);

      if ($existingItem) {
        this.#updateExistingItem($existingItem, itemToAdd);
      } else {
        this.#addNewItemToCart(itemToAdd);
      }

      // 카트 재계산
      this.#calcCart();
    } else {
      alert('재고가 부족합니다.');
    }
  }

  /** 카트 클릭 이벤트 핸들러 */
  #handleCartClick(event) {
    const $target = event.target;
    if (
      $target.classList.contains('quantity-change') ||
      $target.classList.contains('remove-item')
    ) {
      const productId = $target.dataset.productId;
      const $cartItem = document.getElementById(productId);
      const targetProduct = this.productList.find((p) => p.id === productId);

      if (!targetProduct || !$cartItem) return;

      const currentQuantity = parseInt(
        $cartItem.querySelector('span').textContent.split('x ')[1]
      );

      if ($target.classList.contains('quantity-change')) {
        const quantityChange = parseInt($target.dataset.change);
        const newQuantity = currentQuantity + quantityChange;

        if (
          newQuantity > 0 &&
          newQuantity <= targetProduct.q + currentQuantity
        ) {
          $cartItem.querySelector('span').textContent =
            `${$cartItem.querySelector('span').textContent.split('x ')[0]}x ${newQuantity}`;
          targetProduct.q -= quantityChange;
        } else if (newQuantity <= 0) {
          $cartItem.remove();
          targetProduct.q += currentQuantity;
        } else {
          alert('재고가 부족합니다.');
        }
      } else if ($target.classList.contains('remove-item')) {
        targetProduct.q += currentQuantity;
        $cartItem.remove();
      }

      this.#calcCart();
    }
  }
}
