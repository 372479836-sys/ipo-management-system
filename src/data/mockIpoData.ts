import { IpoProjectData } from '@/types/ipo';

export const mockIpoData: IpoProjectData = {
  workstreams: [
    { id: 'ws-1', name: '项目整体协调', sortOrder: 1 },
    { id: 'ws-2', name: '中介委任', sortOrder: 2 },
    { id: 'ws-3', name: '业务尽职调查', sortOrder: 3 },
    { id: 'ws-4', name: '董事、高管及股东尽调', sortOrder: 4 },
    { id: 'ws-5', name: '第三方尽职调查及实地考察', sortOrder: 5 },
    { id: 'ws-6', name: '法律-境外法律尽职调查', sortOrder: 6 },
    { id: 'ws-7', name: '法律-境内法律尽职调查', sortOrder: 7 },
    { id: 'ws-8', name: '法律-其他', sortOrder: 8 },
    { id: 'ws-9', name: '财务', sortOrder: 9 },
    { id: 'ws-10', name: '内控审阅', sortOrder: 10 },
    { id: 'ws-11', name: '行业报告', sortOrder: 11 },
    { id: 'ws-12', name: '招股书', sortOrder: 12 },
    { id: 'ws-13', name: '监管审批', sortOrder: 13 },
  ],
  tasks: [
    // ====== 项目整体协调 ======
    { id: 'task-1', workstreamId: 'ws-1', title: '时间表', sponsor: '华泰', lawyer: '', otherParty: '', currentProgress: '已传阅按天时间表', currentBlocker: '无', nextStep: '各中介审阅后遵照执行', status: 'completed' },
    { id: 'task-2', workstreamId: 'ws-1', title: '中介通讯录', sponsor: '华泰', lawyer: '', otherParty: '', currentProgress: '正在添加刚刚委任的中介信息', currentBlocker: '无', nextStep: '新中介确定后持续更新', status: 'in_progress' },
    { id: 'task-3', workstreamId: 'ws-1', title: '周报材料', sponsor: '华泰、DB、CMS', lawyer: '', otherParty: '', currentProgress: '每周准备', currentBlocker: '无', nextStep: '每周准备', status: 'in_progress' },

    // ====== 中介委任 ======
    { id: 'task-4', workstreamId: 'ws-2', title: '印刷商', sponsor: '华泰', lawyer: '', otherParty: 'GenNex', currentProgress: '已选定GenNex并签署EL', currentBlocker: '无', nextStep: '进场工作（已预留5.18-5.29房间）', status: 'completed' },
    { id: 'task-5', workstreamId: 'ws-2', title: '公司秘书', sponsor: '华泰', lawyer: '', otherParty: 'TMF', currentProgress: '已TMF，EL沟通中', currentBlocker: '无', nextStep: '签署EL，开始非香港公司注册，A1前递交申请', status: 'in_progress' },
    { id: 'task-6', workstreamId: 'ws-2', title: '合规顾问', sponsor: '华泰', lawyer: '', otherParty: 'Somerley', currentProgress: '已选定Somerley并签署EL', currentBlocker: '无', nextStep: '开始工作', status: 'completed' },
    { id: 'task-7', workstreamId: 'ws-2', title: '股票登记处', sponsor: '华泰', lawyer: '', otherParty: 'Vistra', currentProgress: '已选定Vistra并签署EL', currentBlocker: '无', nextStep: '开始工作', status: 'completed' },
    { id: 'task-8', workstreamId: 'ws-2', title: '背调机构', sponsor: '华泰', lawyer: '', otherParty: 'I-OnAsia', currentProgress: '已选定I-OnAsia并签署EL', currentBlocker: '待公司对修订后的EL进行确认；董事、高管人数未确定', nextStep: '优先启动背调工作', status: 'blocked' },

    // ====== 业务尽职调查 ======
    { id: 'task-9', workstreamId: 'ws-3', title: '动力电池业务访谈', sponsor: '华泰', lawyer: '竞天公诚', otherParty: '', currentProgress: '已完成4月21日访谈', currentBlocker: '无', nextStep: '已经开始工作', status: 'completed' },
    { id: 'task-10', workstreamId: 'ws-3', title: '储能系统业务访谈', sponsor: '华泰', lawyer: '竞天公诚', otherParty: '', currentProgress: '已完成4月22日访谈', currentBlocker: '无', nextStep: '完成访谈并传阅纪要', status: 'completed' },
    { id: 'task-11', workstreamId: 'ws-3', title: '人力部门访谈', sponsor: '华泰', lawyer: '竞天公诚', otherParty: '', currentProgress: '暂未预约', currentBlocker: '无', nextStep: '完成访谈并传阅纪要', status: 'in_progress' },
    { id: 'task-12', workstreamId: 'ws-3', title: '法务、内控、环保安全部门访谈', sponsor: '华泰', lawyer: '竞天公诚', otherParty: '', currentProgress: '已提供问卷', currentBlocker: '无', nextStep: '确定访谈时间，完成后传阅纪要', status: 'in_progress' },
    { id: 'task-13', workstreamId: 'ws-3', title: 'BESS业务合并尽调', sponsor: '华泰', lawyer: 'HSF', otherParty: '', currentProgress: 'HSF发出尽调问卷', currentBlocker: '涉及merger accounting，影响后续招股书披露和尽调形式', nextStep: '4月底前回复', status: 'blocked' },
    { id: 'task-14', workstreamId: 'ws-3', title: '工商税务调档', sponsor: 'CMS', lawyer: '竞天公诚', otherParty: '毕马威', currentProgress: '完成2023-2024年的工商税务调档工作，竞天传阅控制表', currentBlocker: '无', nextStep: '公司本周回复问卷，保荐人和审计师进行初步讨论', status: 'in_progress' },
    { id: 'task-15', workstreamId: 'ws-3', title: '英国上市进展', sponsor: '华泰', lawyer: 'HSF', otherParty: '', currentProgress: 'HSF发出尽调问卷', currentBlocker: '无', nextStep: '5月11日周开展2025年、2026年第一季度及剩余一家公司的工商税务调档工作', status: 'in_progress' },

    // ====== 董事、高管及股东尽调 ======
    { id: 'task-16', workstreamId: 'ws-4', title: '董高尽职调查', sponsor: '华泰', lawyer: '达维', otherParty: '', currentProgress: '已于4月初发出董高调查表，公司陆续反馈；访谈问卷已有', currentBlocker: '公司董高人选确定后推进访谈工作', nextStep: '公司4月底前回复问卷', status: 'in_progress' },
    { id: 'task-17', workstreamId: 'ws-4', title: '股东尽职调查', sponsor: '华泰', lawyer: '达维', otherParty: '', currentProgress: '已于4月初发出股东调查表', currentBlocker: '股东反馈调查表中所需信息', nextStep: '本周内发出董事需配合工作清单发给公司', status: 'blocked' },
    { id: 'task-18', workstreamId: 'ws-4', title: '董事会、股东大会材料及召开', sponsor: '华泰', lawyer: '达维', otherParty: '', currentProgress: 'DP发议案给公司进行初步审阅', currentBlocker: '董事人选未定', nextStep: '股东配合于5月中上提供相关信息', status: 'blocked' },
    { id: 'task-19', workstreamId: 'ws-4', title: '董事培训', sponsor: '华泰', lawyer: '达维', otherParty: '', currentProgress: '待董高人选确定后进行董高培训', currentBlocker: '公司董高人选尚未确定', nextStep: '5月11日周确定董事会和股东大会形式与时间', status: 'pending' },
    { id: 'task-20', workstreamId: 'ws-4', title: '日产股权变动', sponsor: '华泰', lawyer: '达维', otherParty: '', currentProgress: '确定方案', currentBlocker: '确定融资', nextStep: '董高人选确定后与董事会一起开展培训', status: 'blocked' },
    { id: 'task-21', workstreamId: 'ws-4', title: '股东特殊权利解除', sponsor: '华泰', lawyer: '达维', otherParty: '', currentProgress: 'DP起草股东特殊权利解除相关文件', currentBlocker: '协调股东', nextStep: '谈判条款', status: 'in_progress' },
    { id: 'task-22', workstreamId: 'ws-4', title: 'Esop调整', sponsor: '华泰', lawyer: '达维', otherParty: '', currentProgress: '待推进', currentBlocker: '无', nextStep: '对文件内容达成一致，A1前完成签署', status: 'in_progress' },

    // ====== 第三方尽职调查及实地考察 ======
    { id: 'task-23', workstreamId: 'ws-5', title: '客户、供应商、银行访谈', sponsor: '华泰', lawyer: '竞天公诚、HSF', otherParty: '', currentProgress: '已开始走访', currentBlocker: '无', nextStep: '陆续安排并走访', status: 'in_progress' },
    { id: 'task-24', workstreamId: 'ws-5', title: '实地考察', sponsor: 'DB', lawyer: '竞天公诚、HSF', otherParty: '', currentProgress: '已开始走访', currentBlocker: '无', nextStep: '陆续安排并走访', status: 'in_progress' },

    // ====== 法律-境外法律尽职调查 ======
    { id: 'task-25', workstreamId: 'ws-6', title: '整体协调', sponsor: '华泰', lawyer: 'HSF', otherParty: '', currentProgress: '确定法律意见书的出具范围及重大标准', currentBlocker: '部分国家法律意见书的实际出具时间', nextStep: '陆续安排并走访', status: 'in_progress' },
    { id: 'task-26', workstreamId: 'ws-6', title: '日本法律意见书', sponsor: '华泰', lawyer: 'HSF', otherParty: 'KWM Japan', currentProgress: '已选定KWM Japan，并定稿EL', currentBlocker: '无', nextStep: 'HSF 4.20周发出境外法律意见书控制表', status: 'completed' },
    { id: 'task-27', workstreamId: 'ws-6', title: '美国法律意见书', sponsor: '华泰', lawyer: 'HSF', otherParty: 'Squire Patton Boggs', currentProgress: '已选定Squire Patton Boggs，并基本定稿EL', currentBlocker: '无', nextStep: '收到尽调问卷，公司准备相关信息', status: 'in_progress' },
    { id: 'task-28', workstreamId: 'ws-6', title: '英国法律意见书', sponsor: '华泰', lawyer: 'HSF', otherParty: 'Womble Bond Dickinson', currentProgress: '已选定Womble Bond Dickinson，正等待EL初稿', currentBlocker: '无', nextStep: '收到尽调问卷，公司准备相关信息', status: 'in_progress' },
    { id: 'task-29', workstreamId: 'ws-6', title: '法国法律意见书', sponsor: '华泰', lawyer: 'HSF', otherParty: 'CMS Francis Lefebvre Avocats', currentProgress: '已选定CMS Francis Lefebvre Avocats，定稿EL', currentBlocker: '无', nextStep: '收到尽调问卷，公司准备相关信息；签署EL', status: 'in_progress' },
    { id: 'task-30', workstreamId: 'ws-6', title: '开曼法律意见书', sponsor: '华泰', lawyer: 'HSF', otherParty: 'Harneys', currentProgress: '已选定Harneys，谈妥EL条款', currentBlocker: '无', nextStep: '收到尽调问卷，公司准备相关信息', status: 'in_progress' },
    { id: 'task-31', workstreamId: 'ws-6', title: '香港法律意见书', sponsor: '华泰', lawyer: 'HSF', otherParty: '', currentProgress: '暂无', currentBlocker: '保荐人确定是否需要单独法律意见书，取决于BESS业务进一步尽调结果', nextStep: '进场准备开曼法律意见书', status: 'pending' },
    { id: 'task-32', workstreamId: 'ws-6', title: '海外子公司尽调问卷', sponsor: '华泰', lawyer: 'HSF', otherParty: '', currentProgress: '已于4月8日发出海外子公司问卷', currentBlocker: '无', nextStep: '如需要，进一步委任，进场工作', status: 'in_progress' },

    // ====== 法律-境内法律尽职调查 ======
    { id: 'task-33', workstreamId: 'ws-7', title: '中国法律意见书', sponsor: '华泰', lawyer: '方达', otherParty: '', currentProgress: '方达于4月3日发出境内法律尽调清单，公司陆续提供材料', currentBlocker: '无', nextStep: '公司回复问卷', status: 'in_progress' },
    { id: 'task-34', workstreamId: 'ws-7', title: '合规函', sponsor: '华泰', lawyer: '方达', otherParty: '', currentProgress: '公司已经陆续开具信用报告，并通过公开检索方式确定合规内容', currentBlocker: '无', nextStep: '4月20日周传阅法律问题重大清单，5月4日传阅法律意见书初稿', status: 'in_progress' },

    // ====== 法律-其他 ======
    { id: 'task-35', workstreamId: 'ws-8', title: '数据合规', sponsor: 'CMS', lawyer: '方达', otherParty: '', currentProgress: '发现两个数据不合规事项，方达数据团队确认属非重大', currentBlocker: '待确认方达对不合规事项的意见表述方式', nextStep: '4月20日周方达发出合规函控制表', status: 'in_progress' },
    { id: 'task-36', workstreamId: 'ws-8', title: 'OFAC', sponsor: 'CMS', lawyer: 'HSF', otherParty: '', currentProgress: 'HSF发出OFAC尽调问卷，公司已回复部分内容', currentBlocker: '确定是否需要OFAC律师', nextStep: '方达确定针对数据合规的意见', status: 'in_progress' },
    { id: 'task-37', workstreamId: 'ws-8', title: 'IP尽调', sponsor: '华泰', lawyer: 'HSF', otherParty: '', currentProgress: 'HSF发出IP尽调问卷，公司已回复', currentBlocker: '公司内部沟通是否委任IP律师及人选', nextStep: '公司陆续回复问卷内容，确定是否需要OFAC律师', status: 'in_progress' },
    { id: 'task-38', workstreamId: 'ws-8', title: '关连交易', sponsor: 'DB', lawyer: '达维', otherParty: '毕马威', currentProgress: 'DP已发出关连交易问卷', currentBlocker: '公司董高人选尚未确定，部分信息无法提供', nextStep: '委任IP律师，尽快签署EL，进场工作', status: 'blocked' },
    { id: 'task-39', workstreamId: 'ws-8', title: '同业竞争', sponsor: 'DB', lawyer: '达维', otherParty: '', currentProgress: 'DP已发出同业竞争问卷', currentBlocker: '需要股东相关信息', nextStep: '公司持续提供已有信息，董高人选确定后完善其他部分', status: 'in_progress' },
    { id: 'task-40', workstreamId: 'ws-8', title: '背调及诉讼查册', sponsor: '华泰', lawyer: '达维', otherParty: '', currentProgress: '背调范围已确定，背调机构已开始工作', currentBlocker: '董事高管人选未定，若背调有重大发现可能影响人选', nextStep: '公司回复问卷', status: 'blocked' },
    { id: 'task-41', workstreamId: 'ws-8', title: 'Bring Down尽调', sponsor: 'CMS', lawyer: '', otherParty: '', currentProgress: '待所有工作完成，递表当天进行', currentBlocker: '无', nextStep: '优先对公司和第三方进行背调，董事高管人员确定后再展开背调', status: 'pending' },
    { id: 'task-42', workstreamId: 'ws-8', title: '专家尽调', sponsor: 'DB', lawyer: '', otherParty: '', currentProgress: '待所有工作基本完成，5月中下进行', currentBlocker: '无', nextStep: '待所有工作完成，递表当天进行', status: 'pending' },

    // ====== 财务 ======
    { id: 'task-43', workstreamId: 'ws-9', title: '审计报告', sponsor: 'DB', lawyer: '', otherParty: '毕马威', currentProgress: '进场开始工作', currentBlocker: '无', nextStep: '4月20日周传阅初稿', status: 'in_progress' },
    { id: 'task-44', workstreamId: 'ws-9', title: '函证发放', sponsor: 'DB', lawyer: '', otherParty: '毕马威', currentProgress: '陆续进行', currentBlocker: '无', nextStep: '陆续进行', status: 'in_progress' },
    { id: 'task-45', workstreamId: 'ws-9', title: '财务尽调', sponsor: 'DB', lawyer: '', otherParty: '毕马威', currentProgress: '待审计报告出具后进行', currentBlocker: '无', nextStep: '待审计报告出具后进行', status: 'pending' },
    { id: 'task-46', workstreamId: 'ws-9', title: '招股书圈数', sponsor: 'DB', lawyer: '', otherParty: '毕马威', currentProgress: '待审计报告出具后进行', currentBlocker: '无', nextStep: '待审计报告出具后进行', status: 'pending' },
    { id: 'task-47', workstreamId: 'ws-9', title: '安慰函及安排函', sponsor: 'DB', lawyer: '', otherParty: '毕马威', currentProgress: '待审计报告出具后进行', currentBlocker: '无', nextStep: '待审计报告出具后进行', status: 'pending' },
    { id: 'task-48', workstreamId: 'ws-9', title: '财务模型', sponsor: 'DB', lawyer: '', otherParty: '毕马威', currentProgress: '财务模型已提供给DB', currentBlocker: '无', nextStep: '就财务模型数据进行进一步尽调', status: 'in_progress' },
    { id: 'task-49', workstreamId: 'ws-9', title: '盈利预测及现金流预测', sponsor: 'DB', lawyer: '', otherParty: '毕马威', currentProgress: '待审计报告出具后进行', currentBlocker: '无', nextStep: '待审计报告出具后进行', status: 'pending' },

    // ====== 内控审阅 ======
    { id: 'task-50', workstreamId: 'ws-10', title: '内控报告', sponsor: 'DB', lawyer: '', otherParty: '毕马威', currentProgress: '已确定报告范围', currentBlocker: '无', nextStep: '待审计报告出具后进行', status: 'in_progress' },

    // ====== 行业报告 ======
    { id: 'task-51', workstreamId: 'ws-11', title: '行业排名', sponsor: 'CMS', lawyer: '', otherParty: 'CIC', currentProgress: 'CIC已有初稿，待与保荐人沟通后发出', currentBlocker: '无', nextStep: '定稿及签署EL，出具初稿', status: 'in_progress' },
    { id: 'task-52', workstreamId: 'ws-11', title: '行业报告', sponsor: 'CMS', lawyer: '', otherParty: 'CIC', currentProgress: 'CIC已传阅行业报告初稿框架', currentBlocker: '无', nextStep: '传阅核心行业数据和排名定稿', status: 'in_progress' },

    // ====== 招股书 ======
    { id: 'task-53', workstreamId: 'ws-12', title: '整体协调', sponsor: '华泰', lawyer: '达维', otherParty: '', currentProgress: '达维会根据整体时间表传阅各章节招股书', currentBlocker: '无', nextStep: '传阅行业报告初稿', status: 'in_progress' },
    { id: 'task-54', workstreamId: 'ws-12', title: '业务—概览', sponsor: '华泰', lawyer: '达维', otherParty: '', currentProgress: '已完成第一次讨论会', currentBlocker: '无', nextStep: '根据时间表传阅各章节及安排招股书讨论会', status: 'completed' },
    { id: 'task-55', workstreamId: 'ws-12', title: '业务—优势', sponsor: 'DB', lawyer: '达维', otherParty: '', currentProgress: '第一次未讨论', currentBlocker: '无', nextStep: '各方修订后，于第二次讨论会上进一步沟通完善', status: 'in_progress' },
    { id: 'task-56', workstreamId: 'ws-12', title: '业务—战略', sponsor: 'DB', lawyer: '达维', otherParty: '', currentProgress: '第一次未讨论', currentBlocker: '无', nextStep: '待第二次讨论会上进行首次审阅沟通', status: 'in_progress' },
    { id: 'task-57', workstreamId: 'ws-12', title: '业务—主要部分', sponsor: '华泰', lawyer: '达维', otherParty: '', currentProgress: '待传阅框架', currentBlocker: '无', nextStep: '待第二次讨论会上进行首次审阅沟通', status: 'pending' },
    { id: 'task-58', workstreamId: 'ws-12', title: '风险因素', sponsor: '华泰', lawyer: '达维', otherParty: '', currentProgress: '待传阅框架', currentBlocker: '无', nextStep: '待传阅', status: 'pending' },
    { id: 'task-59', workstreamId: 'ws-12', title: '行业概述', sponsor: 'CMS', lawyer: '达维', otherParty: 'CIC', currentProgress: '待传阅框架', currentBlocker: '无', nextStep: '待传阅', status: 'pending' },
    { id: 'task-60', workstreamId: 'ws-12', title: '监管概览', sponsor: '华泰', lawyer: '达维', otherParty: '', currentProgress: '待传阅框架', currentBlocker: '无', nextStep: '待传阅', status: 'pending' },
    { id: 'task-61', workstreamId: 'ws-12', title: '历史与公司架构', sponsor: '华泰', lawyer: '达维', otherParty: '', currentProgress: '待传阅框架', currentBlocker: '无', nextStep: '待传阅', status: 'pending' },
    { id: 'task-62', workstreamId: 'ws-12', title: '关连交易', sponsor: 'DB', lawyer: '达维', otherParty: '', currentProgress: '待传阅框架', currentBlocker: '无', nextStep: '待传阅', status: 'pending' },

    // ====== 监管审批 ======
    { id: 'task-63', workstreamId: 'ws-13', title: 'Pre-A1', sponsor: 'DB', lawyer: '达维', otherParty: '', currentProgress: 'Pre A1已经递交联交所并收到初步反馈', currentBlocker: '联交所给出明确意见', nextStep: '等待联交所反馈', status: 'blocked' },
    { id: 'task-64', workstreamId: 'ws-13', title: '红筹架构沟通', sponsor: '华泰', lawyer: '达维', otherParty: '', currentProgress: '待推进', currentBlocker: '需要发改委等给出明确意见', nextStep: '4.20周DP再与联交所口头沟通进度', status: 'blocked' },
    { id: 'task-65', workstreamId: 'ws-13', title: '证监会备案材料', sponsor: '华泰', lawyer: '方达', otherParty: '', currentProgress: '确定各方分工', currentBlocker: '无', nextStep: '与发改委、商务部和证监会等进一步沟通', status: 'in_progress' },
    { id: 'task-66', workstreamId: 'ws-13', title: '联交所A1 Pack', sponsor: 'DB', lawyer: '达维', otherParty: '', currentProgress: '确定各方分工', currentBlocker: '无', nextStep: '5月中传阅初稿', status: 'in_progress' },
  ],
  ganttCells: [
    // 项目整体协调
    { id: 'gc-task-1-2026-04-01-0', taskId: 'task-1', date: '2026-04-01', label: '启动', type: 'event' },
    { id: 'gc-task-1-2026-04-10-0', taskId: 'task-1', date: '2026-04-10', label: '传阅时间表', type: 'milestone' },
    // 中介委任
    { id: 'gc-task-4-2026-04-15-0', taskId: 'task-4', date: '2026-04-15', label: '签署EL', type: 'milestone' },
    { id: 'gc-task-4-2026-05-18-0', taskId: 'task-4', date: '2026-05-18', label: '进场工作', type: 'event' },
    { id: 'gc-task-8-2026-04-20-0', taskId: 'task-8', date: '2026-04-20', label: '签署EL', type: 'milestone' },
    // 业务尽调
    { id: 'gc-task-9-2026-04-21-0', taskId: 'task-9', date: '2026-04-21', label: '完成访谈', type: 'milestone' },
    { id: 'gc-task-10-2026-04-22-0', taskId: 'task-10', date: '2026-04-22', label: '完成访谈', type: 'milestone' },
    // 法律-境外
    { id: 'gc-task-26-2026-04-15-0', taskId: 'task-26', date: '2026-04-15', label: '定稿EL', type: 'milestone' },
    // 招股书
    { id: 'gc-task-54-2026-04-17-0', taskId: 'task-54', date: '2026-04-17', label: '第一次讨论会', type: 'event' },
    // 监管审批
    { id: 'gc-task-63-2026-04-01-0', taskId: 'task-63', date: '2026-04-01', label: '递交Pre A1', type: 'milestone' },
    { id: 'gc-task-63-2026-04-15-0', taskId: 'task-63', date: '2026-04-15', label: '收到反馈', type: 'event' },
  ],
};
