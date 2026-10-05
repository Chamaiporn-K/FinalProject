const test = require('node:test');
const assert = require('node:assert/strict');
const { createFinanceAI } = require('../finance-ai');
const input = { userId: 7, month: '2026-10', summary: { balance: 800, totalIncome: 1000, totalExpense: 200, expenseByCategory: [{category:'อาหาร', amount:200}], vsLastMonth:{incomeDelta:1000,expenseDelta:200}, email:'private@example.com', password:'private', notes:'private' }, budget:{categoryBudgets:[],savingGoal:null} };
const answer = [{type:'budget',text:'กำหนดงบค่าอาหารให้สอดคล้องกับรายรับ'}];
function result(insights = answer) { return { ok:true, json:async () => ({status:'completed', output:[{type:'message', content:[{type:'output_text',text:JSON.stringify({insights})}]}]}) }; }
test('missing key never calls the provider', async () => {
  const ai = createFinanceAI({fetchImpl:async () => {throw new Error('must not call');}});
  await assert.rejects(ai.generate(input), e => e.status === 503);
});
test('calls requested model and only sends selected aggregate fields', async () => {
  const ai = createFinanceAI({apiKey:'unit-test-key',fetchImpl:async (url, opts) => {
    assert.equal(url,'https://api.openai.com/v1/responses');
    const body = JSON.parse(opts.body);assert.equal(body.model,'gpt-6-luna');assert.equal(body.store,false);
    assert.equal(body.text.format.type,'json_schema');
    const data = JSON.parse(body.input[0].content);
    assert.equal(data.summary.balance,800); assert.ok(!('userId' in data));
    for(const key of ['email','password','notes']) assert.ok(!JSON.stringify(data).includes(key));
    return result();
  }});
  assert.deepEqual(await ai.generate(input),answer.map(i=>({...i,type:'ai_budget'})));
});
test('identical requests share cache but different owners and values do not', async () => {
  let calls=0;
  const ai=createFinanceAI({apiKey:'unit-test-key',fetchImpl:async()=>{calls++;return result();}});
  await Promise.all([ai.generate(input),ai.generate(input)]);await ai.generate(input);assert.equal(calls,1);
  await ai.generate({...input,userId:8});assert.equal(calls,2);
  await ai.generate({...input,summary:{...input.summary,totalExpense:300}});assert.equal(calls,3);
});
test('provider errors never expose keys or response body', async () => {
  const ai=createFinanceAI({apiKey:'unit-test-key',fetchImpl:async()=>({ok:false,status:401,json:async()=>({secret:'unit-test-key'})})});
  await assert.rejects(ai.generate(input),e=>e.status===503&&!e.message.includes('unit-test-key'));
});
test('network failure provides a controlled error', async () => {
  const ai=createFinanceAI({apiKey:'unit-test-key',fetchImpl:async()=>{throw new Error('private network info');}});
  await assert.rejects(ai.generate(input),e=>e.status===503&&!e.message.includes('private'));
});
test('rejects incomplete and malformed responses', async () => {
  for(const response of [ {ok:true,json:async()=>({status:'incomplete',output:[]})},result([]),result([{type:'unknown',text:'no'}]),result([{type:'summary',text:''}]) ]) {
    const ai=createFinanceAI({apiKey:'unit-test-key',fetchImpl:async()=>response});
    await assert.rejects(ai.generate(input),e=>e.status===503);
  }
});
