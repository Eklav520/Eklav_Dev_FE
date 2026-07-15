import React, { useEffect, useRef } from 'react'
import { GazeDirection } from './useGazeDetection'

// Complete MediaPipe FaceMesh tesselation — 468 edge pairs
const TESSELATION: [number,number][] = [
  [127,34],[34,139],[139,127],[11,0],[0,37],[37,11],[232,231],[231,120],[120,232],
  [72,37],[37,39],[39,72],[128,121],[121,47],[47,128],[232,121],[121,128],[128,232],
  [104,69],[69,67],[67,104],[175,171],[171,148],[148,175],[157,154],[154,155],[155,157],
  [118,50],[50,101],[101,118],[73,39],[39,40],[40,73],[9,151],[151,108],[108,9],
  [48,115],[115,131],[131,48],[194,204],[204,211],[211,194],[74,40],[40,185],[185,74],
  [80,42],[42,183],[183,80],[40,92],[92,186],[186,40],[230,229],[229,118],[118,230],
  [202,212],[212,214],[214,202],[83,18],[18,17],[17,83],[76,61],[61,146],[146,76],
  [160,29],[29,30],[30,160],[56,157],[157,173],[173,56],[106,204],[204,194],[194,106],
  [135,214],[214,192],[192,135],[203,165],[165,98],[98,203],[21,71],[71,68],[68,21],
  [51,45],[45,4],[4,51],[144,24],[24,23],[23,144],[77,146],[146,91],[91,77],
  [205,50],[50,187],[187,205],[201,200],[200,18],[18,201],[91,106],[106,182],[182,91],
  [90,91],[91,181],[181,90],[85,84],[84,17],[17,85],[206,203],[203,36],[36,206],
  [148,171],[171,140],[140,148],[92,40],[40,39],[39,92],[193,189],[189,244],[244,193],
  [159,158],[158,28],[28,159],[247,246],[246,161],[161,247],[236,3],[3,196],[196,236],
  [54,68],[68,104],[104,54],[193,168],[168,8],[8,193],[117,228],[228,31],[31,117],
  [189,193],[193,55],[55,189],[98,97],[97,99],[99,98],[126,47],[47,100],[100,126],
  [166,79],[79,218],[218,166],[155,154],[154,26],[26,155],[209,49],[49,131],[131,209],
  [135,136],[136,150],[150,135],[203,206],[206,165],[165,203],[126,209],[209,217],[217,126],
  [98,165],[165,203],[203,98],[21,20],[20,60],[60,21],[115,220],[220,45],[45,115],
  [4,275],[275,343],[343,4],[240,75],[75,235],[235,240],[239,105],[105,63],[63,239],
  [80,81],[81,82],[82,80],[35,31],[31,228],[228,35],[183,42],[42,80],[80,183],
  [40,185],[185,186],[186,40],[119,230],[230,118],[118,119],[210,202],[202,214],[214,210],
  [84,83],[83,17],[17,84],[77,76],[76,61],[61,77],[160,159],[159,27],[27,160],
  [46,53],[53,52],[52,46],[225,224],[224,223],[223,225],[53,46],[46,44],[44,53],
  [31,25],[25,226],[226,31],[24,25],[25,23],[23,24],[144,26],[26,22],[22,144],
  [354,461],[461,323],[323,354],[366,323],[323,361],[361,366],[401,362],[362,365],[365,401],
  [374,373],[373,380],[380,374],[381,380],[380,373],[373,381],[396,335],[335,321],[321,396],
  [388,387],[387,386],[386,388],[467,466],[466,263],[263,467],[342,250],[250,462],[462,342],
  [300,293],[293,334],[334,300],[283,282],[282,295],[295,283],[300,276],[276,283],[283,300],
  [416,429],[429,358],[358,416],[392,289],[289,290],[290,392],[339,297],[297,332],[332,339],
  [175,152],[152,396],[396,175],[411,416],[416,427],[427,411],[423,358],[358,371],[371,423],
  [385,259],[259,387],[387,385],[254,373],[373,253],[253,254],[374,380],[380,252],[252,374],
  [1,44],[44,19],[19,1],[94,2],[2,370],[370,94],[315,50],[50,316],[316,315],
  [7,163],[163,144],[144,7],[246,161],[161,160],[160,246],[78,95],[95,88],[88,78],
  [116,123],[123,117],[117,116],[50,118],[118,101],[101,50],[36,100],[100,126],[126,36],
  [47,121],[121,128],[128,47],[7,33],[33,144],[144,7],[285,295],[295,282],[282,285],
  [334,293],[293,300],[300,334],[276,283],[283,285],[285,276],[407,415],[415,310],[310,407],
  [270,409],[409,291],[291,270],[321,375],[375,405],[405,321],[314,269],[269,267],[267,314],
  [0,267],[267,269],[269,0],[61,146],[146,77],[77,61],[57,186],[186,92],[92,57],
  [43,106],[106,182],[182,43],[106,43],[43,204],[204,106],[264,371],[371,423],[423,264],
  [459,462],[462,250],[250,459],[253,374],[374,252],[252,253],[301,389],[389,251],[251,301],
  [366,361],[361,288],[288,366],[397,365],[365,379],[379,397],[400,377],[377,152],[152,400],
  [381,374],[374,373],[373,381],[249,390],[390,463],[463,249],[339,448],[448,255],[255,339],
  [359,467],[467,260],[260,359],[255,339],[339,254],[254,255],[446,261],[261,340],[340,446],
  [380,381],[381,252],[252,380],[391,393],[393,164],[164,391],[373,253],[253,381],[381,373],
  [276,391],[391,393],[393,276],[292,407],[407,415],[415,292],[358,371],[371,355],[355,358],
  [429,358],[358,423],[423,429],[265,413],[413,464],[464,265],[343,277],[277,278],[278,343],
  [434,432],[432,430],[430,434],[394,395],[395,369],[369,394],[395,394],[394,378],[378,395],
  [400,296],[296,334],[334,400],[348,347],[347,329],[329,348],[374,252],[252,317],[317,374],
  [395,369],[369,396],[396,395],[270,267],[267,302],[302,270],[307,325],[325,320],[320,307],
  [425,427],[427,411],[411,425],[213,192],[192,214],[214,213],[418,424],[424,406],[406,418],
  [422,430],[430,432],[432,422],[416,411],[411,425],[425,416],[288,361],[361,397],[397,288],
  [401,454],[454,323],[323,401],[365,323],[323,361],[361,365],[340,261],[261,440],[440,340],
]

const LEFT_EYE  = [33,7,163,144,145,153,154,155,133,173,157,158,159,160,161,246]
const RIGHT_EYE = [362,382,381,380,374,373,390,249,263,466,388,387,386,385,384,398]

interface Props {
  landmarks: any | null
  faceDetected: boolean
  direction: GazeDirection
  isLookingAway: boolean
  violationCount: number
  lookAwaySeconds: number
  headDirection: GazeDirection
  isHeadTurned: boolean
  headViolationCount: number
  headAwaySeconds: number
}

function drawCornerBrackets(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  arm: number, color: string, lw: number,
) {
  ctx.strokeStyle = color
  ctx.lineWidth = lw
  ctx.lineCap = 'square'
  const corners: [number, number, number, number][] = [
    [x,   y,   arm,  arm],
    [x+w, y,   -arm, arm],
    [x+w, y+h, -arm, -arm],
    [x,   y+h, arm,  -arm],
  ]
  corners.forEach(([cx, cy, dx, dy]) => {
    ctx.beginPath()
    ctx.moveTo(cx + dx, cy)
    ctx.lineTo(cx, cy)
    ctx.lineTo(cx, cy + dy)
    ctx.stroke()
  })
}

const GazeScanOverlay: React.FC<Props> = ({
  landmarks, faceDetected, direction, isLookingAway, violationCount, lookAwaySeconds,
  headDirection, isHeadTurned, headViolationCount, headAwaySeconds,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef   = useRef<number>(0)
  const lmRef     = useRef<any>(null)
  const propsRef  = useRef({ faceDetected, direction, isLookingAway, violationCount, lookAwaySeconds })

  useEffect(() => {
    lmRef.current = landmarks
    propsRef.current = { faceDetected, direction, isLookingAway, violationCount, lookAwaySeconds, headDirection, isHeadTurned, headViolationCount, headAwaySeconds }
  }, [landmarks, faceDetected, direction, isLookingAway, violationCount, lookAwaySeconds, headDirection, isHeadTurned, headViolationCount, headAwaySeconds])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let running = true

    const loop = () => {
      if (!running) return
      animRef.current = requestAnimationFrame(loop)

      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const W = canvas.width
      const H = canvas.height
      ctx.clearRect(0, 0, W, H)

      const { faceDetected: fd, isLookingAway: away, violationCount: vc, lookAwaySeconds: secs, direction: dir,
              isHeadTurned: headTurned, headViolationCount: hvc, headAwaySeconds: hsecs, headDirection: hdir } = propsRef.current
      const lm = lmRef.current

      const anyAlert  = away || headTurned
      const mainColor = anyAlert ? '#ef4444' : '#3b82f6'
      const mainRgb   = anyAlert ? '239,68,68' : '59,130,246'

      // ── No face: dashed brackets ────────────────────────────────
      if (!fd || !lm || lm.length < 100) {
        const bx = W*0.18, by = H*0.08, bw = W*0.64, bh = H*0.82
        ctx.strokeStyle = 'rgba(239,68,68,0.75)'
        ctx.setLineDash([6,4])
        drawCornerBrackets(ctx, bx, by, bw, bh, 24, 'rgba(239,68,68,0.9)', 2.5)
        ctx.setLineDash([])
        ctx.fillStyle = 'rgba(239,68,68,0.88)'
        ctx.font = 'bold 11px "Segoe UI",monospace'
        ctx.textAlign = 'center'
        ctx.fillText('NO FACE DETECTED', W/2, H - 12)
        return
      }

      // Widen mesh horizontally — push each point away from canvas center
      const cx = W / 2
      const WIDEN = 1.85
      const pt = (i: number) => ({
        x: cx + (lm[i].x * W - cx) * WIDEN,
        y: lm[i].y * H,
      })

      // ── Tight bounding box using widened landmark positions ─────
      let minX = W, maxX = 0, minY = H, maxY = 0
      for (let i = 0; i < Math.min(lm.length, 468); i++) {
        if (!lm[i]) continue
        const p = pt(i)
        if (p.x < minX) minX = p.x; if (p.x > maxX) maxX = p.x
        if (p.y < minY) minY = p.y; if (p.y > maxY) maxY = p.y
      }
      const pad = 14
      const bx = minX - pad, by = minY - pad
      const bw = maxX - minX + pad*2, bh = maxY - minY + pad*2

      // ── Mesh tesselation lines ──────────────────────────────────
      ctx.strokeStyle = `rgba(${mainRgb},0.38)`
      ctx.lineWidth = 0.6
      ctx.lineCap = 'round'
      TESSELATION.forEach(([a, b]) => {
        if (!lm[a] || !lm[b]) return
        const pa = pt(a), pb = pt(b)
        ctx.beginPath()
        ctx.moveTo(pa.x, pa.y)
        ctx.lineTo(pb.x, pb.y)
        ctx.stroke()
      })

      // ── Landmark dots at every widened vertex ───────────────────
      for (let i = 0; i < Math.min(lm.length, 468); i++) {
        if (!lm[i]) continue
        const p = pt(i)
        ctx.beginPath()
        ctx.arc(p.x, p.y, 2.4, 0, 2 * Math.PI)
        ctx.fillStyle = 'rgba(255,255,255,0.93)'
        ctx.fill()
      }

      // ── Eye outlines (brighter accent) ──────────────────────────
      const eyeAccent = away ? 'rgba(252,165,165,0.9)' : 'rgba(147,197,253,0.9)'
      ;[LEFT_EYE, RIGHT_EYE].forEach(ring => {
        ctx.beginPath()
        ring.forEach((idx, j) => {
          const p = pt(idx)
          if (j === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y)
        })
        ctx.closePath()
        ctx.strokeStyle = eyeAccent
        ctx.lineWidth = 1.6
        ctx.stroke()
      })

      // ── Iris tracking (refined landmarks 468-477) ───────────────
      if (lm.length >= 478) {
        [[468,469,470,471,472],[473,474,475,476,477]].forEach(ring => {
          const cIdx = ring[0]
          if (!lm[cIdx]) return
          const cp = pt(cIdx)
          let r = 0
          ring.slice(1).forEach(ri => {
            const rp = pt(ri)
            r += Math.hypot(rp.x - cp.x, rp.y - cp.y)
          })
          r = Math.max(r / (ring.length - 1), 5)

          // Outer glow
          const grd = ctx.createRadialGradient(cp.x, cp.y, r*0.2, cp.x, cp.y, r*1.8)
          grd.addColorStop(0, `rgba(${mainRgb},0.55)`)
          grd.addColorStop(1, `rgba(${mainRgb},0)`)
          ctx.beginPath()
          ctx.arc(cp.x, cp.y, r*1.8, 0, 2*Math.PI)
          ctx.fillStyle = grd
          ctx.fill()

          // Iris circle
          ctx.beginPath()
          ctx.arc(cp.x, cp.y, r, 0, 2*Math.PI)
          ctx.strokeStyle = mainColor
          ctx.lineWidth = 2
          ctx.stroke()

          // Crosshair
          const ch = r * 0.8
          ctx.strokeStyle = 'rgba(255,255,255,0.85)'
          ctx.lineWidth = 1
          ctx.beginPath(); ctx.moveTo(cp.x-ch, cp.y); ctx.lineTo(cp.x+ch, cp.y); ctx.stroke()
          ctx.beginPath(); ctx.moveTo(cp.x, cp.y-ch); ctx.lineTo(cp.x, cp.y+ch); ctx.stroke()

          // Pupil
          ctx.beginPath()
          ctx.arc(cp.x, cp.y, 2.5, 0, 2*Math.PI)
          ctx.fillStyle = '#ffffff'
          ctx.fill()
        })
      }

      // ── Bounding box: corner brackets only ─────────────────────
      drawCornerBrackets(ctx, bx, by, bw, bh, 20, mainColor, 3)

      // ── Status label at top-center of box ──────────────────────
      const label = (() => {
        if (away && secs >= 1 && headTurned && hsecs >= 1)
          return `EYE ${secs}s | HEAD ${hsecs}s  Eye:${vc} Head:${hvc}`
        if (away && secs >= 1)
          return `LOOK AT CAMERA  ${secs}s  |  Eye Violations: ${vc}`
        if (headTurned && hsecs >= 1)
          return `HEAD TURNED ${hdir.toUpperCase()}  ${hsecs}s  |  Head Violations: ${hvc}`
        if (vc > 0 || hvc > 0)
          return `Eye: ${vc}  Head: ${hvc}`
        return 'FACE TRACKING'
      })()

      const labelBg = anyAlert
        ? 'rgba(239,68,68,0.92)'
        : (vc > 0 || hvc > 0)
          ? 'rgba(220,38,38,0.88)'
          : 'rgba(37,99,235,0.92)'

      ctx.font = 'bold 11px "Segoe UI",monospace'
      const tw = ctx.measureText(label).width
      const lx = bx + bw / 2 - tw / 2 - 10
      const ly = by - 24

      // Pill background
      ctx.fillStyle = labelBg
      ctx.beginPath()
      if ((ctx as any).roundRect) {
        ;(ctx as any).roundRect(lx, ly, tw + 20, 20, 4)
      } else {
        ctx.rect(lx, ly, tw + 20, 20)
      }
      ctx.fill()

      // Label text
      ctx.fillStyle = '#ffffff'
      ctx.textAlign = 'left'
      ctx.fillText(label, lx + 10, ly + 14)

      // Corner dots on label
      const dotColor = away ? '#fca5a5' : '#93c5fd'
      ;[[lx, ly],[lx+tw+20, ly],[lx+tw+20, ly+20],[lx, ly+20]].forEach(([dx, dy]) => {
        ctx.beginPath()
        ctx.arc(dx, dy, 3, 0, 2*Math.PI)
        ctx.fillStyle = dotColor
        ctx.fill()
      })
    }

    loop()
    return () => { running = false; cancelAnimationFrame(animRef.current) }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      width={640}
      height={480}
      style={{
        position: 'absolute',
        top: 0, left: 0,
        width: '100%', height: '100%',
        pointerEvents: 'none',
        zIndex: 6,
      }}
    />
  )
}

export default GazeScanOverlay
