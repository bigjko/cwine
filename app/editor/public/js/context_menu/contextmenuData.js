module.exports = exports = [
{
	name: 'Add Node',
	subMenu: 
	[
		{
			name:'Variable',
			cmd: { name: 'addnode', type: 'varnode' }
		}, 
		{
			name:'Condition',
			cmd: { name: 'addnode', type : 'ifnode' }
		}
	]
}
];