const InsuranceRegistry = artifacts.require("InsuranceRegistry");
const HospitalBillContract = artifacts.require("HospitalBillContract");
const GovStable = artifacts.require("GovStable");

module.exports = async function(callback) {
  try {
    console.log('获取角色哈希值...\n');
    
    const registry = await InsuranceRegistry.deployed();
    const hospital = await HospitalBillContract.deployed();
    const gov = await GovStable.deployed();
    
    console.log('GOV_ROLE:', await registry.GOV_ROLE());
    console.log('HOSPITAL_ROLE:', await hospital.HOSPITAL_ROLE());
    console.log('REIMBURSE_ROLE:', await hospital.REIMBURSE_ROLE());
    console.log('MINTER_ROLE:', await gov.MINTER_ROLE());
    console.log('DEFAULT_ADMIN_ROLE: 0x0000000000000000000000000000000000000000000000000000000000000000');
    
    callback();
  } catch (error) {
    console.error('错误:', error);
    callback(error);
  }
};