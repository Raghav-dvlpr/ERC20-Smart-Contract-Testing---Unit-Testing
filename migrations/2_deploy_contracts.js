const ColorToken = artifacts.require('ColorToken');

module.exports = function (deployer) {
  deployer.deploy(ColorToken, 'Color Token', 'CT', 1000000000, 18).then(() => {
    console.log('ColorToken contract address is: ', ColorToken.address);
  });
};
