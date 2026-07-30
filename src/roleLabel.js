window.OctopusRoleLabel = (function () {
  function suffix(role) {
    if (!role || role === 'DISERTANTE') return ''
    const label = role.charAt(0) + role.slice(1).toLowerCase()
    return ` (${label})`
  }

  return { suffix }
})()
