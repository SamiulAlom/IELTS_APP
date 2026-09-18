import {chromium,expect} from '@playwright/test';
import {readFileSync,mkdirSync} from 'node:fs';
const passages=JSON.parse(readFileSync('data/reading/reading-sourced.json','utf8'));
const browser=await chromium.launch({channel:'chrome',headless:true});
const context=await browser.newContext({baseURL:'http://127.0.0.1:3101',viewport:{width:1440,height:1000}});
const page=await context.newPage();page.setDefaultTimeout(25000);
const errors=[];page.on('pageerror',e=>errors.push(e.message));mkdirSync('.runtime/screenshots',{recursive:true});
try{
  await page.goto('/reading');await expect(page.locator('.reading-priority-card')).toHaveCount(5);
  await page.locator('.reading-priority-card').first().click();await expect(page.getByLabel('Start with task')).toHaveValue('NOTE_COMPLETION');
  await page.getByRole('button',{name:'Start / resume practice',exact:true}).click();await expect(page.getByRole('region',{name:'Note completion exercise'})).toBeVisible();
  await expect(page.locator('.reading-inline-blank input')).toHaveCount(6);
  await page.getByLabel('Answer 1',{exact:true}).fill('fine sand');await expect(page.getByText(/Word limit exceeded:/)).toBeVisible();await page.getByLabel('Answer 1',{exact:true}).fill('sand');
  await page.getByLabel('Answer 2',{exact:true}).fill('30');await page.getByLabel('Reading notes',{exact:true}).fill('Grouped notes survive reload.');
  await expect(page.getByRole('status').first()).toContainText('All reading changes saved');await page.reload();await expect(page.getByLabel('Answer 1',{exact:true})).toHaveValue('sand');await expect(page.getByLabel('Answer 2',{exact:true})).toHaveValue('30');
  await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);await page.locator('.reading-note-sheet').screenshot({path:'.runtime/screenshots/reading-notes-mobile.png'});await page.setViewportSize({width:1440,height:1000});
  for(const p of passages){
    if(p!==passages[0]){await page.goto(`/reading?id=${p.id}&focus=MATCHING_SENTENCE_ENDINGS`);await expect(page.getByLabel('Start with task')).toHaveValue('MATCHING_SENTENCE_ENDINGS');await page.getByRole('button',{name:'Start / resume practice',exact:true}).click();await expect(page.getByRole('region',{name:'Sentence Endings exercise'})).toBeVisible();}
    const id=new URL(page.url()).searchParams.get('attempt');let activeType='';
    for(let i=0;i<p.questions.length;i++){
      const q=p.questions[i];
      if(q.type!==activeType){await page.getByLabel('Task group',{exact:true}).selectOption(String(i));activeType=q.type;
        const block=page.locator(q.type==='NOTE_COMPLETION'?'.reading-note-group':'.reading-matching-group');await expect(block).toBeVisible();
        if(q.type.startsWith('MATCHING')){await expect(page.locator('.reading-shared-options')).toHaveCount(1);await expect(page.locator('.reading-matching-row')).toHaveCount(p.questions.filter(item=>item.type===q.type).length);}
        await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),q.type).toBe(false);await page.setViewportSize({width:1440,height:1000});
        await block.screenshot({path:`.runtime/screenshots/reading-${q.type.toLowerCase()}.png`});
      }
      const input=page.getByLabel(`Answer ${i+1}`,{exact:true});if(q.options.length)await input.selectOption(q.answer);else await input.fill(q.answer);
    }
    await page.getByRole('button',{name:'Save now',exact:true}).click();await expect(page.getByRole('status').first()).toContainText('All reading changes saved');
    const saved=await(await context.request.get(`/api/reading?attemptId=${id}`)).json();for(const q of p.questions)expect(saved.draft.answers[q.id]).toBe(q.answer);expect(JSON.stringify(saved)).not.toContain('keyEvidence');expect(saved.result).toBeNull();
    if(p===passages[0]){await expect(page.getByLabel('Answer 16',{exact:true})).toHaveValue('F');await expect(page.getByLabel('Answer 18',{exact:true})).toHaveValue('F');}
    page.once('dialog',dialog=>dialog.accept());await page.getByRole('button',{name:'Finish practice',exact:true}).click();await expect(page.locator('.reading-results')).toContainText('100%');
    await page.reload();await expect(page.locator('.reading-results')).toContainText(`${p.questions.length} / ${p.questions.length}`);await expect(page.locator('.reading-evidence')).toContainText('Correct answer');await expect(page.locator('.evidence-key').first()).toBeVisible();
    await expect(page.locator('.reading-source')).toContainText('Public-domain extracts');
  }
  // New mock options must use their real paragraph letter, without changing old snapshots.
  const mock=await(await context.request.post('/api/reading?action=start',{data:{mockTestId:'reading-mock-01',clientKey:crypto.randomUUID()}})).json();
  if(mock.error)throw Error(mock.error);
  for(const q of mock.passages.flatMap(p=>p.questions).filter(q=>q.type==='MATCHING_INFORMATION'))for(const o of q.options)expect(o).toBe(`${o[0]}. Paragraph ${o[0]}`);
  expect(errors).toEqual([]);console.log('PASS: five priority formats, all 29 new answers, group focus, notes/number limits, repeated letters, autosave/reload, evidence, attribution and mobile.');
}catch(error){await page.screenshot({path:'.runtime/screenshots/reading-matching-failure.png',fullPage:true});throw error;}finally{await browser.close();}
