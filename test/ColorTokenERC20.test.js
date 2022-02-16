const { expect } = require('chai');
const { accounts, contract, web3 } = require('@openzeppelin/test-environment');
const { expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { describe } = require('mocha');

const [owner, user1, user2, user3] = accounts;
const ColorTokenER20 = contract.fromArtifact('ColorToken');
const BN = web3.utils.toBN;

describe('ColorToken ERC20 Contract Testing @Raja Ragavan', () => {
  const totalSupplyBN = BN(2000000000);
  const decimalBN = BN(18);


  beforeEach(async () => {
    this.CT_Token = await ColorTokenER20.new('Color Token', 'CT', 2000000000, 18, {
      from: owner,
    });
   
  });

  describe('Deployment', () => {
    it('deployer is owner', async () => {
      expect(await this.CT_Token.owner()).to.equal(owner);
    });
  });

  describe('Checking Metadata of Token', () => {
    it('token metadata is correct', async () => {
      expect(await this.CT_Token.name()).to.equal('Color Token');
      expect(await this.CT_Token.symbol()).to.equal('CT');
      expect((await this.CT_Token.decimals()).eq(decimalBN)).is.true;
      expect((await this.CT_Token.totalSupply()).div(BN(10 ** 18)).eq(totalSupplyBN)).is.true;
    });
  });

  describe('Token Transfer', () => {
    it('coins are minted and transfered to the owner', async () => {
      expect((await this.CT_Token.balanceOf(owner)).div(BN(10 ** 18)).eq(totalSupplyBN)).is.true;
    });
    it('users can transfer tokens to other users', async () => {
      const amountToSendBN = BN(1000).mul(BN(10 ** 18));
      //admin to user1
      await this.CT_Token.transfer(user1, amountToSendBN, {
        from: owner,
      });
      expect((await this.CT_Token.balanceOf(user1)).eq(amountToSendBN)).is.true;
      //user1 to user2
      await this.CT_Token.transfer(user2, amountToSendBN, {
        from: user1,
      });
      expect((await this.CT_Token.balanceOf(user2)).eq(amountToSendBN)).is.true;
    });

    it('event emitted when tokens are transfered', async () => {
      const amountToSendBN = BN(1000).mul(BN(10 ** 18));
      const receipt = await this.CT_Token.transfer(user1, amountToSendBN, {
        from: owner,
      });
      expectEvent(receipt, 'Transfer', { from: owner, to: user1, value: amountToSendBN });
    });

    it('reverts if user tries to transfer tokens without enough balance', async () => {
      const amountToSendBN = BN(1000).mul(BN(10 ** 18));
      await expectRevert(
        this.CT_Token.transfer(user2, amountToSendBN, {
          from: user1,
        }),
        'ERC20: transfer amount exceeds balance -- Reason given: ERC20: transfer amount exceeds balance.'
      );
    });
  });

  describe('Allowance', () => {
    it('approve transfer of available tokens by third-party', async () => {
      const amountToSendBN = BN(1000).mul(BN(10 ** 18));
      const balanceOfOwner = await this.CT_Token.balanceOf(owner);
      const balanceOfUser1 = await this.CT_Token.balanceOf(user1);
      const balanceOfUser2 = await this.CT_Token.balanceOf(user2);
      //approving allowance
      await this.CT_Token.approve(user1, amountToSendBN, {
        from: owner,
      });
      //checking allowance
      expect((await this.CT_Token.allowance(owner, user1)).eq(amountToSendBN));
      //verifying transaction of approved tokens
      await this.CT_Token.transferFrom(owner, user2, amountToSendBN, {
        from: user1,
      });
      expect((await this.CT_Token.balanceOf(owner)).eq(balanceOfOwner.sub(amountToSendBN)));
      expect((await this.CT_Token.balanceOf(user1)).eq(balanceOfUser1));
      expect((await this.CT_Token.balanceOf(user2)).eq(balanceOfUser2.add(amountToSendBN)));
    });

    it('event emitted someone approves transfer of available tokens by third-party', async () => {
      const amountToSendBN = BN(1000).mul(BN(10 ** 18));
      const receipt = await this.CT_Token.approve(user1, amountToSendBN, {
        from: owner,
      });
      expectEvent(receipt, 'Approval', { owner, spender: user1, value: amountToSendBN });
    });

    it('increase allowance', async () => {
      const amountToSendBN = BN(1000).mul(BN(10 ** 18));
      const increasedAmountBN = BN(500).mul(BN(10 ** 18));
      await this.CT_Token.approve(user1, amountToSendBN, {
        from: owner,
      });
      expect((await this.CT_Token.allowance(owner, user1)).eq(amountToSendBN));
      await this.CT_Token.increaseAllowance(user1, increasedAmountBN, {
        from: owner,
      });
      expect((await this.CT_Token.allowance(owner, user1)).eq(amountToSendBN.add(increasedAmountBN)));
    });

    it('decrease allowance', async () => {
      const amountToSendBN = BN(1000).mul(BN(10 ** 18));
      const increasedAmountBN = BN(500).mul(BN(10 ** 18));
      await this.CT_Token.approve(user1, amountToSendBN, {
        from: owner,
      });
      expect((await this.CT_Token.allowance(owner, user1)).eq(amountToSendBN));
      await this.CT_Token.increaseAllowance(user1, increasedAmountBN, {
        from: owner,
      });
      expect((await this.CT_Token.allowance(owner, user1)).eq(amountToSendBN.sub(increasedAmountBN)));
    });

    it('revert when trying to approve transfer of unavailable tokens by third-party', async () => {
      const amountToSendBN = BN(1000).mul(BN(10 ** 18));
      //approving allowance
      await this.CT_Token.approve(user2, amountToSendBN, {
        from: user1,
      });
      //checking allowance
      expect((await this.CT_Token.allowance(user1, user2)).eq(amountToSendBN));
      //verifying transaction of approved tokens
      await expectRevert(
        this.CT_Token.transferFrom(user1, user3, amountToSendBN, {
          from: user2,
        }),
        'ERC20: transfer amount exceeds balance -- Reason given: ERC20: transfer amount exceeds balance.'
      );
    });

    it('revert when trying to transfer more than allowed tokens by third-party', async () => {
      const amountToSendBN = BN(1000).mul(BN(10 ** 18));
      //approving allowance
      await this.CT_Token.approve(user1, amountToSendBN, {
        from: owner,
      });
      //checking allowance
      expect((await this.CT_Token.allowance(owner, user1)).eq(amountToSendBN));
      //verifying transaction of approved tokens
      await expectRevert(
        this.CT_Token.transferFrom(owner, user2, amountToSendBN.add(BN(1000)), {
          from: user1,
        }),
        'ERC20: insufficient allowance -- Reason given: ERC20: insufficient allowance.'
      );
    });
  });

  

  describe('Ownership', () => {
    it('transfering ownership', async () => {
      await this.CT_Token.transferOwnership(user1, { from: owner });
      expect(await this.CT_Token.owner()).to.equal(user1);
    });

    it('event emmitted on transfering ownership', async () => {
      const receipt = await this.CT_Token.transferOwnership(user1, { from: owner });
      expectEvent(receipt, 'OwnershipTransferred', { previousOwner: owner, newOwner: user1 });
    });

    it('revert when some user other than owner tries to transfer ownership', async () => {
      await expectRevert(
        this.CT_Token.transferOwnership(user1, { from: user2 }),
        'Ownable: caller is not the owner -- Reason given: Ownable: caller is not the owner.'
      );
    });

    it('renounce ownership', async () => {
      await this.CT_Token.renounceOwnership({ from: owner });
      expect(await this.CT_Token.owner()).to.not.equal(owner);
    });

    it('revert when some user other than owner tries to renounce ownership', async () => {
      await expectRevert(
        this.CT_Token.renounceOwnership({ from: user2 }),
        'Ownable: caller is not the owner -- Reason given: Ownable: caller is not the owner.'
      );
    });
  });

  describe('Burn', () => {
    it('users can burn their own tokens', async () => {
      const amountToBurnBN = BN(500).mul(BN(10 ** 18));
      const ownerInitBalanceBN = await this.CT_Token.balanceOf(owner);

      await this.CT_Token.burn(amountToBurnBN, {
        from: owner,
      });
      expect((await this.CT_Token.balanceOf(owner)).eq(ownerInitBalanceBN.sub(amountToBurnBN))).is.true;
    });

    it('reverts when users tries to burn unavailable tokens', async () => {
      const amountToBurnBN = BN(500).mul(BN(10 ** 18));
      await expectRevert(
        this.CT_Token.burn(amountToBurnBN, {
          from: user1,
        }),
        'ERC20: burn amount exceeds balance -- Reason given: ERC20: burn amount exceeds balance.'
      );
    });

    it('users can burn allowed tokens from another user', async () => {
      const allowanceAmountBN = BN(1000).mul(BN(10 ** 18));
      const amountToBurnBN = BN(500).mul(BN(10 ** 18));
      const ownerInitBalanceBN = await this.CT_Token.balanceOf(owner);
      await this.CT_Token.approve(user1, allowanceAmountBN, {
        from: owner,
      });
      expect((await this.CT_Token.allowance(owner, user1)).eq(allowanceAmountBN));
      await this.CT_Token.burnFrom(owner, amountToBurnBN, {
        from: user1,
      });
      expect((await this.CT_Token.balanceOf(owner)).eq(ownerInitBalanceBN.sub(amountToBurnBN))).is.true;
      expect((await this.CT_Token.allowance(owner, user1)).eq(allowanceAmountBN.sub(amountToBurnBN)));
    });

    it('reverts when users tries to burn tokens more than allowed', async () => {
      const allowanceAmountBN = BN(500).mul(BN(10 ** 18));
      const amountToBurnBN = BN(1000).mul(BN(10 ** 18));
      await this.CT_Token.approve(user1, allowanceAmountBN, {
        from: owner,
      });
      expect((await this.CT_Token.allowance(owner, user1)).eq(allowanceAmountBN));
      await expectRevert(
        this.CT_Token.burnFrom(owner, amountToBurnBN, {
          from: user1,
        }),
        'ERC20: insufficient allowance -- Reason given: ERC20: insufficient allowance.'
      );
    });
  });

  describe('Pause', () => {
    it('owner can pause and unpause the contract', async () => {
      expect(await this.CT_Token.paused()).is.false;
      await this.CT_Token.pause({ from: owner });
      expect(await this.CT_Token.paused()).is.true;
      await this.CT_Token.unpause({ from: owner });
      expect(await this.CT_Token.paused()).is.false;
    });

  

    it('transactions are not allowed while contract is paused', async () => {
      const amountToSendBN = BN(500).mul(BN(10 ** 18));
      expect(await this.CT_Token.paused()).is.false;
      await this.CT_Token.pause({ from: owner });
      await expectRevert(
        this.CT_Token.transfer(user1, amountToSendBN, { from: owner }),
        'Pausable: paused -- Reason given: Pausable: paused.'
      );
    });
  });
});
